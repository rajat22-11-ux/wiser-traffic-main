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
    res.redirect('/#select-property');
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
    res.json({ properties: props });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/properties/select', auth, (req, res) => {
  const { propertyId, propertyName, siteUrl } = req.body;
  if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
  req.session.propertyId = propertyId;
  req.session.propertyName = propertyName || propertyId;
  if (siteUrl) req.session.siteUrl = siteUrl;
  res.json({ ok: true });
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
