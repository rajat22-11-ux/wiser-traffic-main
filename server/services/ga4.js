const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

function getRedirectUri() {
  const base = process.env.APP_URL || 'http://localhost:3001';
  return `${base}/api/auth/callback`;
}

function createClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getRedirectUri()
  );
}

function getAuthUrl() {
  return createClient().generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function exchangeCode(code) {
  const client = createClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

function makeAuthClient(tokens) {
  const client = createClient();
  client.setCredentials(tokens);
  client.on('tokens', (t) => {
    if (t.refresh_token) tokens.refresh_token = t.refresh_token;
    tokens.access_token = t.access_token;
  });
  return client;
}

async function getUserInfo(authClient) {
  const o = google.oauth2({ version: 'v2', auth: authClient });
  const { data } = await o.userinfo.get();
  return data;
}

async function listProperties(authClient) {
  try {
    const admin = google.analyticsadmin({ version: 'v1beta', auth: authClient });
    const { data } = await admin.properties.list({ filter: 'ancestor:accounts/-' });
    return (data.properties || []).map(p => ({
      id: p.name.replace('properties/', ''),
      name: p.displayName,
      url: p.websiteUri || '',
    }));
  } catch {
    return [];
  }
}

// ── GA4 REPORT RUNNER ─────────────────────────────────────────────────────────
async function ga4Report(authClient, propertyId, body) {
  const ga4 = google.analyticsdata({ version: 'v1beta', auth: authClient });
  const { data } = await ga4.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: body,
  });
  return data;
}

function dv(row, i) { return row?.dimensionValues?.[i]?.value || ''; }
function mv(row, i) { return parseFloat(row?.metricValues?.[i]?.value || 0); }

function dateRanges(days) {
  return [{ startDate: `${days}daysAgo`, endDate: 'today' }];
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
async function getOverview(authClient, pid, days) {
  const dr = dateRanges(days);
  const [sum, trend, channels] = await Promise.all([
    ga4Report(authClient, pid, { dateRanges: dr, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'screenPageViews' }, { name: 'engagementRate' }, { name: 'conversions' }] }),
    ga4Report(authClient, pid, { dateRanges: dr, dimensions: [{ name: 'date' }], metrics: [{ name: 'sessions' }, { name: 'totalUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
    ga4Report(authClient, pid, { dateRanges: dr, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
  ]);
  const r = sum.rows?.[0];
  return {
    summary: r ? { sessions: mv(r,0), users: mv(r,1), newUsers: mv(r,2), bounceRate: mv(r,3), avgDuration: mv(r,4), pageviews: mv(r,5), engagementRate: mv(r,6), conversions: mv(r,7) } : {},
    trend: (trend.rows || []).map(r => ({ date: dv(r,0), sessions: mv(r,0), users: mv(r,1) })),
    channels: (channels.rows || []).map(r => ({ channel: dv(r,0), sessions: mv(r,0), users: mv(r,1), bounceRate: mv(r,2), avgDuration: mv(r,3), conversions: mv(r,4) })),
  };
}

// ── AI TRAFFIC ────────────────────────────────────────────────────────────────
const AI_KEYWORDS = ['chatgpt', 'openai', 'perplexity', 'claude', 'anthropic', 'gemini', 'bard', 'copilot', 'you.com', 'phind', 'bing'];

async function getAITraffic(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }, { name: 'engagementRate' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 500,
  });
  const all = data.rows || [];
  const aiRows = all.filter(r => AI_KEYWORDS.some(k => dv(r,0).toLowerCase().includes(k)));
  const totalAI = aiRows.reduce((s, r) => s + mv(r,0), 0);
  const totalAll = all.reduce((s, r) => s + mv(r,0), 0);
  return {
    sources: aiRows.map(r => ({ source: dv(r,0), sessions: mv(r,0), users: mv(r,1), bounceRate: mv(r,2), avgDuration: mv(r,3), conversions: mv(r,4), engagementRate: mv(r,5) })),
    totalAI, totalAll,
    sharePercent: totalAll > 0 ? +((totalAI / totalAll) * 100).toFixed(2) : 0,
  };
}

// ── SOCIAL ────────────────────────────────────────────────────────────────────
const SOCIAL_KW = ['facebook', 'instagram', 'twitter', 'x.com', 'linkedin', 'youtube', 'reddit', 'pinterest', 'tiktok', 'quora'];

async function getSocial(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 200,
  });
  return (data.rows || [])
    .filter(r => SOCIAL_KW.some(k => dv(r,0).toLowerCase().includes(k)))
    .map(r => ({ source: dv(r,0), medium: dv(r,1), sessions: mv(r,0), users: mv(r,1), bounceRate: mv(r,2), avgDuration: mv(r,3), conversions: mv(r,4) }));
}

// ── REFERRALS ─────────────────────────────────────────────────────────────────
async function getReferrals(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'sessionSource' }],
    dimensionFilter: { filter: { fieldName: 'sessionMedium', stringFilter: { matchType: 'EXACT', value: 'referral' } } },
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 50,
  });
  return (data.rows || []).map(r => ({ source: dv(r,0), sessions: mv(r,0), users: mv(r,1), newUsers: mv(r,2), bounceRate: mv(r,3), avgDuration: mv(r,4), conversions: mv(r,5) }));
}

// ── SHOPIFY ───────────────────────────────────────────────────────────────────
async function getShopifyTraffic(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'sessionSource' }, { name: 'landingPage' }],
    dimensionFilter: { filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'CONTAINS', value: 'shopify' } } },
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 30,
  });
  const rows = (data.rows || []).map(r => ({ source: dv(r,0), landingPage: dv(r,1), sessions: mv(r,0), users: mv(r,1), conversions: mv(r,2), bounceRate: mv(r,3), avgDuration: mv(r,4) }));
  return { rows, totalSessions: rows.reduce((s,r)=>s+r.sessions,0), totalConversions: rows.reduce((s,r)=>s+r.conversions,0) };
}

// ── RETURN VISITORS ───────────────────────────────────────────────────────────
async function getReturnVisitors(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'newVsReturning' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'conversions' }, { name: 'engagementRate' }],
  });
  const result = {};
  (data.rows || []).forEach(r => {
    const k = dv(r,0) === 'new' ? 'new' : 'returning';
    result[k] = { sessions: mv(r,0), users: mv(r,1), bounceRate: mv(r,2), avgDuration: mv(r,3), conversions: mv(r,4), engagementRate: mv(r,5) };
  });
  return result;
}

// ── CONVERSIONS ───────────────────────────────────────────────────────────────
async function getConversions(authClient, pid, days) {
  const data = await ga4Report(authClient, pid, {
    dateRanges: dateRanges(days),
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'conversions' }, { name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
  });
  return (data.rows || []).map(r => ({
    channel: dv(r,0), conversions: mv(r,0), sessions: mv(r,1), users: mv(r,2),
    rate: mv(r,1) > 0 ? +((mv(r,0)/mv(r,1))*100).toFixed(2) : 0,
  }));
}

// ── SEO (Search Console) ──────────────────────────────────────────────────────
async function getSEO(authClient, siteUrl, days) {
  if (!siteUrl) return null;
  try {
    const gsc = google.searchconsole({ version: 'v1', auth: authClient });
    const end = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now() - days*86400000).toISOString().slice(0,10);
    const [kw, pages, countries] = await Promise.all([
      gsc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 50 } }),
      gsc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ['page'], rowLimit: 20 } }),
      gsc.searchanalytics.query({ siteUrl, requestBody: { startDate: start, endDate: end, dimensions: ['country'], rowLimit: 20 } }),
    ]);
    const mapRow = r => ({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: +(r.ctr*100).toFixed(2), position: +r.position.toFixed(1) });
    return {
      keywords: (kw.data.rows||[]).map(mapRow),
      pages: (pages.data.rows||[]).map(mapRow),
      countries: (countries.data.rows||[]).map(mapRow),
      summary: {
        totalClicks: (kw.data.rows||[]).reduce((s,r)=>s+r.clicks,0),
        totalImpressions: (kw.data.rows||[]).reduce((s,r)=>s+r.impressions,0),
        avgPosition: (kw.data.rows||[]).length > 0 ? +((kw.data.rows||[]).reduce((s,r)=>s+r.position,0)/(kw.data.rows||[]).length).toFixed(1) : 0,
      },
    };
  } catch { return null; }
}

module.exports = { getAuthUrl, exchangeCode, makeAuthClient, getUserInfo, listProperties, getOverview, getAITraffic, getSocial, getReferrals, getShopifyTraffic, getReturnVisitors, getConversions, getSEO };
