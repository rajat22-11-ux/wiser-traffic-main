import React from 'react';

export const Loading = ({ text = 'Loading data…' }) => (
  <div className="loading"><div className="spinner" />{text}</div>
);

export const Err = ({ msg }) => <div className="err">{msg}</div>;

export function useFetch(url, deps = []) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    if (!url) return;
    setLoading(true); setError(''); setData(null);
    import('../api').then(({ default: api }) =>
      api.get(url)
        .then(r => setData(r.data))
        .catch(e => setError(e.response?.data?.error || 'Failed to load.'))
        .finally(() => setLoading(false))
    );
  // eslint-disable-next-line
  }, [url, ...deps]);
  return { data, loading, error };
}

export const Pills = ({ value, onChange, options = [7, 30, 90] }) => (
  <div className="pills">
    {options.map(d => (
      <button key={d} className={`pill ${value === d ? 'active' : ''}`} onClick={() => onChange(d)}>{d}d</button>
    ))}
  </div>
);

export function KCard({ label, value, delta, color, mono }) {
  const v = value ?? '—';
  const formatted = typeof v === 'number' ? v.toLocaleString() : v;
  const d = parseFloat(delta);
  return (
    <div className="kcard">
      <div className="kcard-label">{label}</div>
      <div className="kcard-value" style={color ? { color } : {}}>{formatted}</div>
      {delta != null && <div className={`kcard-delta ${d > 0 ? 'delta-up' : d < 0 ? 'delta-dn' : 'delta-n'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)}% vs prev</div>}
    </div>
  );
}

export const fmtD = s => { const m = Math.floor(s / 60), sec = Math.round(s % 60); return `${m}m ${sec}s`; };
export const fmtP = n => `${(n * 100).toFixed(1)}%`;
export const fmtN = n => Math.round(n || 0).toLocaleString();

export const BounceCell = ({ v }) => {
  const p = (v * 100).toFixed(1);
  const cls = v > 0.6 ? 'b-red' : v > 0.4 ? 'b-amber' : 'b-green';
  return <span className={`badge ${cls}`}>{p}%</span>;
};

export const AI_META = {
  chatgpt: { label: 'ChatGPT', color: '#10a37f' }, openai: { label: 'ChatGPT', color: '#10a37f' },
  perplexity: { label: 'Perplexity', color: '#6366f1' }, claude: { label: 'Claude', color: '#f472b6' },
  anthropic: { label: 'Claude', color: '#f472b6' }, gemini: { label: 'Gemini', color: '#4f8ef7' },
  bard: { label: 'Gemini', color: '#4f8ef7' }, copilot: { label: 'Copilot', color: '#0078d4' },
  bing: { label: 'Bing AI', color: '#0078d4' },
};
export const getAIMeta = src => { const s = (src||'').toLowerCase(); for (const [k,v] of Object.entries(AI_META)) if (s.includes(k)) return v; return { label: src, color: '#888' }; };

export const SOCIAL_COLORS = { facebook: '#1877f2', instagram: '#e1306c', twitter: '#000', linkedin: '#0a66c2', youtube: '#ff0000', reddit: '#ff4500', pinterest: '#e60023', tiktok: '#010101' };
export const getSocialColor = src => { const s = (src||'').toLowerCase(); for (const [k,v] of Object.entries(SOCIAL_COLORS)) if (s.includes(k)) return v; return '#888'; };
