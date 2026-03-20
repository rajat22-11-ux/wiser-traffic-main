const express = require('express');
const router = express.Router();
const ga4 = require('../services/ga4');

function auth(req, res, next) {
  if (!req.session?.tokens) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
function ready(req, res, next) {
  if (!req.session?.tokens || !req.session?.propertyId) return res.status(401).json({ error: 'Not connected to GA4' });
  next();
}
function client(req) { return ga4.makeAuthClient(req.session.tokens); }
function days(req) { return parseInt(req.query.days) || 30; }

// ── AUTH ──────────────────────────────────────────────────────────────────────

router.get('/auth/login', (req, res) => {
  res.redirect(ga4.getAuthUrl());
});

router.get('/auth/callback', async (req, res) => {
  try {
    const tokens = await ga4.exchangeCode(req.query.code);
    req.session.tokens = tokens;
    const authClient = client(req);
    const user = await ga4.getUserInfo(authClient);
    req.session.user = { name: user.name, email: user.email, picture: user.picture };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err.message);
        return res.redirect('/?error=auth_failed');
      }

      res.redirect('/#select-property');
    });
  } catch (e) {
    console.error('Auth callback error:', e.message);
    res.redirect('/?error=auth_failed');
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/auth/me', (req, res) => {
  if (!req.session?.tokens) return res.json({ connected: false });
  res.json({
    connected: true,
    propertySelected: !!req.session.propertyId,
    user: req.session.user,
    propertyId: req.session.propertyId,
    propertyName: req.session.propertyName,
    siteUrl: req.session.siteUrl,
  });
});

// ── PROPERTIES ────────────────────────────────────────────────────────────────

router.get('/properties', auth, async (req, res) => {
  try {
    const props = await ga4.listProperties(client(req));
    res.json({ properties: props, allowManualEntry: true });
  } catch (e) {
    if (['analytics_admin_api_disabled', 'analytics_admin_access_denied'].includes(e.code)) {
      return res.json({
        properties: [],
        allowManualEntry: true,
        lookupError: e.message,
        lookupErrorCode: e.code,
      });
    }

    res.status(e.status || 500).json({ error: e.message, code: e.code || 'property_lookup_failed' });
  }
});

router.post('/properties/select', auth, async (req, res) => {
  const { propertyId, propertyName, siteUrl } = req.body;
  const cleanPropertyId = String(propertyId || '').trim();
  const cleanSiteUrl = String(siteUrl || '').trim();

  if (!cleanPropertyId) return res.status(400).json({ error: 'propertyId required', code: 'missing_property_id' });

  try {
    await ga4.validateProperty(client(req), cleanPropertyId);
    req.session.propertyId = cleanPropertyId;
    req.session.propertyName = String(propertyName || cleanPropertyId).trim();

    if (cleanSiteUrl) req.session.siteUrl = cleanSiteUrl;
    else delete req.session.siteUrl;

    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, code: e.code || 'property_select_failed' });
  }
});

// ── DATA ROUTES ───────────────────────────────────────────────────────────────

router.get('/overview', ready, async (req, res) => {
  try { res.json(await ga4.getOverview(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/ai-traffic', ready, async (req, res) => {
  try { res.json(await ga4.getAITraffic(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/social', ready, async (req, res) => {
  try { res.json(await ga4.getSocial(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/referrals', ready, async (req, res) => {
  try { res.json(await ga4.getReferrals(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/shopify', ready, async (req, res) => {
  try { res.json(await ga4.getShopifyTraffic(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/return-visitors', ready, async (req, res) => {
  try { res.json(await ga4.getReturnVisitors(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/conversions', ready, async (req, res) => {
  try { res.json(await ga4.getConversions(client(req), req.session.propertyId, days(req))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/seo', ready, async (req, res) => {
  try {
    const siteUrl = req.session.siteUrl || process.env.GSC_SITE_URL;
    const data = await ga4.getSEO(client(req), siteUrl, days(req));
    res.json(data || { error: 'Search Console not configured' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
