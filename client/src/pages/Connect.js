import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Connect({ onConnected }) {
  const [step, setStep] = useState('login');
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState('');
  const [selName, setSelName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupWarning, setLookupWarning] = useState('');
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromOauthCallback = window.location.hash === '#select-property';

    if (params.get('error')) {
      setError('Google sign-in failed. Please try again.');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (fromOauthCallback) {
      window.history.replaceState({}, '', '/');
      setStep('select');
      loadProps();
      return;
    }

    api.get('/auth/me')
      .then((r) => {
        if (r.data.connected && !r.data.propertySelected) {
          setStep('select');
          loadProps();
        }
      })
      .catch(() => {});
  }, []);

  async function loadProps() {
    setLoading(true);
    setError('');
    setLookupWarning('');

    try {
      const r = await api.get('/properties');
      const nextProps = r.data.properties || [];
      setProperties(nextProps);

      if (r.data.lookupError) {
        setLookupWarning(r.data.lookupError);
        setManualMode(true);
      } else if (!nextProps.length) {
        setLookupWarning('No GA4 properties were returned for this Google account. Enter a GA4 property ID manually to continue.');
        setManualMode(true);
      } else {
        setManualMode(false);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setStep('login');
        setError('Your Google session expired. Sign in again.');
      } else {
        setProperties([]);
        setLookupWarning(err.response?.data?.error || 'Could not load GA4 properties automatically. Enter a GA4 property ID manually to continue.');
        setManualMode(true);
      }
    }

    setLoading(false);
  }

  async function handleSelect() {
    const propertyId = selected.trim();
    if (!propertyId) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/properties/select', { propertyId, propertyName: selName, siteUrl });
      onConnected();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Please check the GA4 property ID and try again.');
    }

    setLoading(false);
  }

  const styles = {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' },
    card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px', width: '100%', maxWidth: 440 },
    logo: { fontSize: 32, fontWeight: 700, color: 'var(--accent)', letterSpacing: -1, marginBottom: 4 },
    sub: { fontSize: 12, color: 'var(--muted)', marginBottom: 28, fontFamily: 'var(--mono)' },
    gBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '12px 20px', background: '#fff', color: '#3c4043', border: '1px solid #dadce0', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'box-shadow .15s', marginBottom: 20, textDecoration: 'none' },
    feature: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 6 },
    check: { color: 'var(--accent)', fontWeight: 700, fontSize: 13 },
    label: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' },
    divider: { borderTop: '1px solid var(--border)', margin: '20px 0' },
    note: { fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', background: 'rgba(79,142,247,.08)', border: '1px solid rgba(79,142,247,.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 },
    linkBtn: { background: 'none', border: 0, color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)' },
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>Wiser Traffic</div>
        <div style={styles.sub}>Analytics Dashboard - Powered by Google Analytics 4</div>

        {error && <div className="err" style={{ marginBottom: 16 }}>{error}</div>}

        {step === 'login' && (
          <>
            <a href="/api/auth/login" style={styles.gBtn} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,.2)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Sign in with Google
            </a>
            <div style={styles.divider} />
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--faint)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>What you will see after connecting</div>
            {[
              'Traffic overview + trend comparison',
              'AI traffic from ChatGPT, Perplexity, Claude, and Gemini',
              'Social media platform breakdown',
              'Referral domains + conversion rates',
              'Shopify App Store traffic & keyword installs',
              'Return visitor analysis',
              'SEO rankings from Search Console',
              'Competitor keyword analysis',
            ].map((f, i) => (
              <div key={i} style={styles.feature}><span style={styles.check}>+</span>{f}</div>
            ))}
          </>
        )}

        {step === 'select' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Select your GA4 property</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>Choose the Google Analytics property for Wiser</div>
            {lookupWarning && <div style={styles.note}>{lookupWarning}</div>}

            {loading ? <div className="loading"><div className="spinner" />Loading your properties...</div> : (
              <>
                {properties.length > 0 && !manualMode && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={styles.label}>GA4 Property</label>
                    <select style={{ width: '100%', marginBottom: 10 }} value={selected} onChange={e => {
                      setSelected(e.target.value);
                      const p = properties.find(x => x.id === e.target.value);
                      setSelName(p?.name || '');
                      if (p?.url) setSiteUrl(p.url);
                    }}>
                      <option value="">Choose a property...</option>
                      {properties.map(p => <option key={p.id} value={p.id}>{p.name} - {p.url || p.id}</option>)}
                    </select>
                    <button type="button" style={styles.linkBtn} onClick={() => {
                      setManualMode(true);
                      setSelected('');
                      setSelName('');
                    }}>
                      Enter GA4 property ID manually
                    </button>
                  </div>
                )}

                {(manualMode || properties.length === 0) && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={styles.label}>GA4 Property ID</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="123456789"
                      value={selected}
                      onChange={e => {
                        setSelected(e.target.value.replace(/[^\d]/g, ''));
                        setSelName('');
                      }}
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Find this in GA4 Admin - Property settings.</div>
                    {properties.length > 0 && (
                      <button type="button" style={{ ...styles.linkBtn, marginTop: 8 }} onClick={() => {
                        setManualMode(false);
                        setSelected('');
                        setSelName('');
                      }}>
                        Choose from detected properties instead
                      </button>
                    )}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Search Console URL <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--faint)' }}>(optional - enables SEO tab)</span></label>
                  <input type="text" placeholder="https://wiser.io" value={siteUrl} onChange={e => setSiteUrl(e.target.value)} style={{ width: '100%' }} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} disabled={!selected.trim() || loading} onClick={handleSelect}>
                  {loading ? 'Connecting...' : 'Open Dashboard ->'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
