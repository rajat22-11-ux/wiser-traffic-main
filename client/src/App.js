import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import './index.css';
import api from './api';
import Connect from './pages/Connect';
import { Overview, AITraffic, Social, Referrals, Shopify, ReturnVisitors, Conversions, SEO } from './pages/Pages';

function useAuth() {
  const [auth, setAuth] = useState({ loading: true, connected: false });
  const refresh = useCallback(() => {
    api.get('/auth/me').then(r => setAuth({ ...r.data, loading: false })).catch(() => setAuth({ loading: false, connected: false }));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { auth, refresh };
}

function Layout({ auth, onLogout }) {
  const NAV = [
    { to: '/', label: 'Overview', icon: '▦', end: true },
    { section: 'Traffic' },
    { to: '/ai', label: 'AI Traffic', icon: '🤖' },
    { to: '/social', label: 'Social Media', icon: '📱' },
    { to: '/referrals', label: 'Referrals', icon: '🔗' },
    { to: '/return', label: 'Return Visitors', icon: '🔁' },
    { section: 'Shopify' },
    { to: '/shopify', label: 'App Store', icon: '🛍️' },
    { to: '/conversions', label: 'Conversions', icon: '🎯' },
    { section: 'SEO' },
    { to: '/seo', label: 'SEO Rankings', icon: '📈' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Wiser Traffic</h1>
          <p>Analytics Dashboard</p>
        </div>
        <nav style={{ flex: 1 }}>
          {NAV.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-group">{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>{item.label}
              </NavLink>
            )
          )}
        </nav>
        <div className="sidebar-foot">
          {auth.user && (
            <div className="user-info">
              {auth.user.picture && <img src={auth.user.picture} alt="" className="user-avatar" />}
              <div>
                <div className="user-name">{auth.user.name}</div>
                <div className="user-prop">{auth.propertyName || auth.propertyId}</div>
              </div>
            </div>
          )}
          <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>Disconnect</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}

export default function App() {
  const { auth, refresh } = useAuth();

  async function logout() {
    await api.post('/auth/logout');
    refresh();
  }

  if (auth.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 13, color: '#4a4a50', fontFamily: 'DM Mono, monospace' }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!auth.connected || !auth.propertySelected) {
    return <Connect onConnected={refresh} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout auth={auth} onLogout={logout} />}>
          <Route index element={<Overview />} />
          <Route path="ai" element={<AITraffic />} />
          <Route path="social" element={<Social />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="return" element={<ReturnVisitors />} />
          <Route path="shopify" element={<Shopify />} />
          <Route path="conversions" element={<Conversions />} />
          <Route path="seo" element={<SEO />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
