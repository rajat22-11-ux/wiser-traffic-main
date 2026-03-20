import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loading, Err, useFetch, Pills, KCard, fmtD, fmtP, fmtN, BounceCell, getAIMeta, getSocialColor } from '../components/Shared';

const CHART_COLORS = ['#4f8ef7','#34d399','#fbbf24','#f87171','#a78bfa','#f472b6','#2dd4bf','#fb923c'];

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
export function Overview() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/overview?days=${days}`, [days]);
  const s = data?.summary || {};
  return (
    <div>
      <div className="topbar">
        <div><h2>Traffic Overview</h2><div className="topbar-sub">All channels · GA4</div></div>
        <Pills value={days} onChange={setDays} />
      </div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {data && <>
        <div className="kgrid">
          <KCard label="Sessions" value={s.sessions} />
          <KCard label="Users" value={s.users} />
          <KCard label="Bounce Rate" value={fmtP(s.bounceRate||0)} />
          <KCard label="Avg Duration" value={fmtD(s.avgDuration||0)} />
          <KCard label="Pageviews" value={s.pageviews} />
          <KCard label="Engagement Rate" value={fmtP(s.engagementRate||0)} color="var(--green)" />
          <KCard label="New Users" value={s.newUsers} />
          <KCard label="Conversions" value={s.conversions} color="var(--accent)" />
        </div>
        <div className="card">
          <div className="card-title">Sessions trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.trend} margin={{ top:4,right:8,left:0,bottom:0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.2}/><stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}/></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.15}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:'#4a4a50' }} tickFormatter={d=>d.slice(4)} />
              <YAxis tick={{ fontSize:10, fill:'#4a4a50' }} />
              <Tooltip contentStyle={{ background:'#1e1e22', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12 }} />
              <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#4f8ef7" strokeWidth={2} fill="url(#g1)" dot={false} />
              <Area type="monotone" dataKey="users" name="Users" stroke="#34d399" strokeWidth={1.5} fill="url(#g2)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid2">
          <div className="card" style={{ marginBottom:0 }}>
            <div className="card-title">By channel</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={data.channels} dataKey="sessions" nameKey="channel" cx="40%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {data.channels.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#1e1e22', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }} />
                <Legend wrapperStyle={{ fontSize:10, color:'#8a8880' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ marginBottom:0 }}>
            <div className="card-title">Channel table</div>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead><tr><th>Channel</th><th>Sessions</th><th>Bounce</th><th>Conv.</th></tr></thead>
              <tbody>
                {data.channels.map((c,i) => (
                  <tr key={i}>
                    <td><span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],marginRight:6 }} />{c.channel}</td>
                    <td style={{ fontWeight:500 }}>{fmtN(c.sessions)}</td>
                    <td><BounceCell v={c.bounceRate} /></td>
                    <td>{fmtN(c.conversions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </div>
  );
}

// ── AI TRAFFIC ────────────────────────────────────────────────────────────────
export function AITraffic() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/ai-traffic?days=${days}`, [days]);
  return (
    <div>
      <div className="topbar">
        <div><h2>AI Traffic <span className="ai-badge">New channel</span></h2><div className="topbar-sub">ChatGPT · Perplexity · Claude · Gemini · Copilot</div></div>
        <Pills value={days} onChange={setDays} />
      </div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {data && <>
        <div className="kgrid-3">
          <KCard label="AI Sessions" value={data.totalAI} color="var(--accent2)" />
          <KCard label="Share of Traffic" value={`${data.sharePercent}%`} />
          <KCard label="AI Sources Detected" value={data.sources?.length} />
        </div>
        {data.sources?.length === 0 && (
          <div className="card"><div className="empty">
            <div style={{ fontSize:32,marginBottom:12 }}>🤖</div>
            <div style={{ fontSize:14,fontWeight:600,marginBottom:6,color:'var(--text)' }}>No AI traffic detected yet</div>
            <div>As ChatGPT, Perplexity, and other AI tools mention Wiser, sessions appear here.<br/>This channel is growing fast — check back weekly.</div>
          </div></div>
        )}
        {data.sources?.length > 0 && <>
          <div className="grid2">
            <div className="card" style={{ marginBottom:0 }}>
              <div className="card-title">Sources breakdown</div>
              {data.sources.map((s,i) => {
                const m = getAIMeta(s.source);
                const max = data.sources[0]?.sessions || 1;
                return (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:28,height:28,borderRadius:6,background:m.color+'25',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,color:m.color,fontWeight:700 }}>{m.label.slice(0,2)}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:500 }}>{m.label}</div>
                      <div style={{ fontSize:10,color:'var(--faint)',fontFamily:'var(--mono)' }}>{s.source}</div>
                      <div className="bar-bg"><div className="bar-fill" style={{ width:`${(s.sessions/max)*100}%`,background:m.color }} /></div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontSize:13,fontWeight:600 }}>{fmtN(s.sessions)}</div>
                      <div style={{ fontSize:10,color:'var(--faint)' }}>{fmtP(s.bounceRate)} bounce</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card" style={{ marginBottom:0 }}>
              <div className="card-title">Quality vs organic</div>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead><tr><th>Source</th><th>Sessions</th><th>Duration</th><th>Conv.</th><th>Rate</th></tr></thead>
                <tbody>
                  {data.sources.map((s,i) => {
                    const m = getAIMeta(s.source);
                    const rate = s.sessions > 0 ? ((s.conversions/s.sessions)*100).toFixed(1) : 0;
                    return <tr key={i}>
                      <td><span style={{ display:'inline-block',width:8,height:8,borderRadius:2,background:m.color,marginRight:6 }} />{m.label}</td>
                      <td style={{ fontWeight:500 }}>{fmtN(s.sessions)}</td>
                      <td style={{ fontFamily:'var(--mono)',fontSize:11 }}>{fmtD(s.avgDuration)}</td>
                      <td>{fmtN(s.conversions)}</td>
                      <td><span className={`badge ${parseFloat(rate)>3?'b-green':parseFloat(rate)>1?'b-amber':'b-gray'}`}>{rate}%</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>}
      </>}
    </div>
  );
}

// ── SOCIAL ────────────────────────────────────────────────────────────────────
export function Social() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/social?days=${days}`, [days]);
  const rows = Array.isArray(data) ? data : [];
  const total = rows.reduce((s,r)=>s+r.sessions,0);
  return (
    <div>
      <div className="topbar"><div><h2>Social Media</h2><div className="topbar-sub">Sessions from social platforms</div></div><Pills value={days} onChange={setDays} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {!loading && !error && <>
        <div className="kgrid-3">
          <KCard label="Social Sessions" value={total} />
          <KCard label="Top Platform" value={rows[0]?.source || '—'} />
          <KCard label="Conversions" value={rows.reduce((s,r)=>s+r.conversions,0)} color="var(--green)" />
        </div>
        <div className="card">
          <div className="card-title">Platform breakdown</div>
          {rows.length === 0 ? <div className="empty">No social media traffic found for this period.</div> : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Platform</th><th>Sessions</th><th>Share</th><th>Users</th><th>Bounce</th><th>Duration</th><th>Conv.</th></tr></thead>
              <tbody>
                {rows.map((r,i) => {
                  const c = getSocialColor(r.source);
                  return <tr key={i}>
                    <td><div style={{ display:'flex',alignItems:'center',gap:7 }}><div style={{ width:8,height:8,borderRadius:2,background:c }} /><span style={{ fontWeight:500 }}>{r.source}</span></div></td>
                    <td style={{ fontWeight:500 }}>{fmtN(r.sessions)}</td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                        <div style={{ width:36,height:3,background:'var(--bg4)',borderRadius:2 }}><div style={{ height:3,borderRadius:2,background:c,width:`${total>0?(r.sessions/total*100):0}%` }} /></div>
                        <span style={{ fontSize:10,fontFamily:'var(--mono)' }}>{total>0?(r.sessions/total*100).toFixed(1):0}%</span>
                      </div>
                    </td>
                    <td>{fmtN(r.users)}</td>
                    <td><BounceCell v={r.bounceRate} /></td>
                    <td style={{ fontFamily:'var(--mono)',fontSize:11 }}>{fmtD(r.avgDuration)}</td>
                    <td style={{ color:'var(--green)',fontWeight:500 }}>{fmtN(r.conversions)}</td>
                  </tr>;
                })}
              </tbody>
            </table></div>
          )}
        </div>
      </>}
    </div>
  );
}

// ── REFERRALS ─────────────────────────────────────────────────────────────────
export function Referrals() {
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const { data, loading, error } = useFetch(`/referrals?days=${days}`, [days]);
  const rows = Array.isArray(data) ? data : [];
  const filtered = rows.filter(r => !search || r.source.toLowerCase().includes(search.toLowerCase()));
  const total = rows.reduce((s,r)=>s+r.sessions,0);
  const totalC = rows.reduce((s,r)=>s+r.conversions,0);
  return (
    <div>
      <div className="topbar"><div><h2>Referral Traffic</h2><div className="topbar-sub">Blogs, review sites, partners, directories</div></div><Pills value={days} onChange={setDays} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {!loading && !error && <>
        <div className="kgrid">
          <KCard label="Referral Sessions" value={total} />
          <KCard label="Referring Domains" value={rows.length} />
          <KCard label="Conversions" value={totalC} color="var(--green)" />
          <KCard label="Avg Conv. Rate" value={total>0?`${((totalC/total)*100).toFixed(2)}%`:'0%'} />
        </div>
        <div className="card">
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
            <div className="card-title" style={{ marginBottom:0 }}>All referrers</div>
            <input type="text" placeholder="Filter domain…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:180 }} />
          </div>
          <div className="tbl-wrap"><table>
            <thead><tr><th>Domain</th><th>Sessions</th><th>New Users</th><th>Bounce</th><th>Duration</th><th>Conv.</th><th>Conv. Rate</th></tr></thead>
            <tbody>
              {filtered.map((r,i) => {
                const cr = r.sessions>0?((r.conversions/r.sessions)*100).toFixed(2):0;
                return <tr key={i}>
                  <td><a href={`https://${r.source}`} target="_blank" rel="noreferrer" style={{ color:'var(--accent)',fontWeight:500,textDecoration:'none',fontFamily:'var(--mono)',fontSize:11 }}>{r.source}</a></td>
                  <td style={{ fontWeight:500 }}>{fmtN(r.sessions)}</td>
                  <td>{fmtN(r.newUsers)}</td>
                  <td><BounceCell v={r.bounceRate} /></td>
                  <td style={{ fontFamily:'var(--mono)',fontSize:11 }}>{fmtD(r.avgDuration)}</td>
                  <td style={{ color:'var(--green)' }}>{fmtN(r.conversions)}</td>
                  <td><span className={`badge ${parseFloat(cr)>2?'b-green':parseFloat(cr)>0.5?'b-amber':'b-gray'}`}>{cr}%</span></td>
                </tr>;
              })}
              {filtered.length===0&&<tr><td colSpan={7} className="empty">No referrers found.</td></tr>}
            </tbody>
          </table></div>
        </div>
      </>}
    </div>
  );
}

// ── SHOPIFY ───────────────────────────────────────────────────────────────────
export function Shopify() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/shopify?days=${days}`, [days]);
  const rows = data?.rows || [];
  const ts = data?.totalSessions || 0;
  const tc = data?.totalConversions || 0;
  return (
    <div>
      <div className="topbar"><div><h2>Shopify App Store</h2><div className="topbar-sub">Traffic from apps.shopify.com</div></div><Pills value={days} onChange={setDays} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {data && <>
        <div className="kgrid">
          <KCard label="Shopify Sessions" value={ts} color="#96bf48" />
          <KCard label="Conversions" value={tc} />
          <KCard label="Conv. Rate" value={ts>0?`${((tc/ts)*100).toFixed(2)}%`:'0%'} />
          <KCard label="Landing Pages" value={rows.length} />
        </div>
        <div className="card">
          <div className="card-title">Traffic by landing page</div>
          {rows.length===0 ? (
            <div className="empty">
              <div style={{ fontSize:28,marginBottom:8 }}>🛍️</div>
              <div style={{ fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4 }}>No Shopify App Store traffic detected</div>
              <div>Traffic from apps.shopify.com will appear here once it occurs.</div>
            </div>
          ) : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Source</th><th>Landing Page</th><th>Sessions</th><th>Conv.</th><th>Bounce</th><th>Duration</th></tr></thead>
              <tbody>
                {rows.map((r,i) => <tr key={i}>
                  <td style={{ fontFamily:'var(--mono)',fontSize:11,fontWeight:500,color:'#96bf48' }}>{r.source}</td>
                  <td style={{ fontFamily:'var(--mono)',fontSize:10,color:'var(--muted)',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.landingPage}</td>
                  <td style={{ fontWeight:500 }}>{fmtN(r.sessions)}</td>
                  <td style={{ color:'var(--green)',fontWeight:500 }}>{fmtN(r.conversions)}</td>
                  <td><BounceCell v={r.bounceRate} /></td>
                  <td style={{ fontFamily:'var(--mono)',fontSize:11 }}>{fmtD(r.avgDuration)}</td>
                </tr>)}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="info">To track Shopify App Store keyword installs, verify your app listing URL (apps.shopify.com/wiser) in Google Search Console and add it as your Search Console URL in settings.</div>
      </>}
    </div>
  );
}

// ── RETURN VISITORS ───────────────────────────────────────────────────────────
export function ReturnVisitors() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/return-visitors?days=${days}`, [days]);
  const n = data?.new || {};
  const r = data?.returning || {};
  const total = (n.sessions||0) + (r.sessions||0) || 1;
  const newPct = ((n.sessions||0)/total*100).toFixed(1);
  const retPct = ((r.sessions||0)/total*100).toFixed(1);
  const StatBox = ({ label, value }) => (
    <div style={{ background:'var(--bg3)',borderRadius:8,padding:10 }}>
      <div style={{ fontSize:9,color:'var(--faint)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:17,fontWeight:600 }}>{value}</div>
    </div>
  );
  return (
    <div>
      <div className="topbar"><div><h2>Return Visitors</h2><div className="topbar-sub">New vs returning user analysis</div></div><Pills value={days} onChange={setDays} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {data && <>
        <div className="card">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11,fontWeight:500 }}>
            <span style={{ color:'var(--accent)' }}>New — {newPct}%</span>
            <span style={{ color:'var(--green)' }}>Returning — {retPct}%</span>
          </div>
          <div style={{ height:8,borderRadius:4,background:'var(--bg4)',overflow:'hidden',display:'flex' }}>
            <div style={{ width:newPct+'%',background:'var(--accent)',transition:'width .5s' }} />
            <div style={{ flex:1,background:'var(--green)' }} />
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:5,fontSize:10,color:'var(--faint)',fontFamily:'var(--mono)' }}>
            <span>{fmtN(n.sessions||0)} sessions</span>
            <span>{fmtN(r.sessions||0)} sessions</span>
          </div>
        </div>
        <div className="grid2">
          <div className="card" style={{ borderTop:'2px solid var(--accent)',marginBottom:0 }}>
            <div style={{ fontSize:12,fontWeight:600,color:'var(--accent)',marginBottom:12 }}>New Visitors</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
              <StatBox label="Sessions" value={fmtN(n.sessions)} />
              <StatBox label="Bounce Rate" value={fmtP(n.bounceRate||0)} />
              <StatBox label="Avg Duration" value={fmtD(n.avgDuration||0)} />
              <StatBox label="Conversions" value={fmtN(n.conversions)} />
            </div>
          </div>
          <div className="card" style={{ borderTop:'2px solid var(--green)',marginBottom:0 }}>
            <div style={{ fontSize:12,fontWeight:600,color:'var(--green)',marginBottom:12 }}>Returning Visitors</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
              <StatBox label="Sessions" value={fmtN(r.sessions)} />
              <StatBox label="Bounce Rate" value={fmtP(r.bounceRate||0)} />
              <StatBox label="Avg Duration" value={fmtD(r.avgDuration||0)} />
              <StatBox label="Conversions" value={fmtN(r.conversions)} />
            </div>
            {n.sessions>0 && r.sessions>0 && r.conversions>0 && n.conversions>0 && (
              <div style={{ marginTop:10,padding:'8px 10px',background:'rgba(52,211,153,0.1)',borderRadius:8,fontSize:10,color:'var(--green)',fontFamily:'var(--mono)' }}>
                {r.conversions/r.sessions > n.conversions/n.sessions
                  ? `✓ Returning converts ${(((r.conversions/r.sessions)/(n.conversions/n.sessions)-1)*100).toFixed(0)}% better`
                  : `New visitors converting better this period`}
              </div>
            )}
          </div>
        </div>
      </>}
    </div>
  );
}

// ── CONVERSIONS ───────────────────────────────────────────────────────────────
export function Conversions() {
  const [days, setDays] = useState(30);
  const { data, loading, error } = useFetch(`/conversions?days=${days}`, [days]);
  const rows = Array.isArray(data) ? data : [];
  const tc = rows.reduce((s,r)=>s+r.conversions,0);
  const ts = rows.reduce((s,r)=>s+r.sessions,0);
  const best = [...rows].sort((a,b)=>b.rate-a.rate)[0];
  const maxRate = rows.reduce((m,r)=>Math.max(m,r.rate),0) || 1;
  return (
    <div>
      <div className="topbar"><div><h2>Conversions</h2><div className="topbar-sub">Goal completions by channel</div></div><Pills value={days} onChange={setDays} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {!loading && !error && <>
        <div className="kgrid">
          <KCard label="Total Conversions" value={tc} color="var(--green)" />
          <KCard label="Overall Rate" value={ts>0?`${((tc/ts)*100).toFixed(2)}%`:'0%'} />
          <KCard label="Best Channel" value={best?.channel||'—'} />
          <KCard label="Total Sessions" value={ts} />
        </div>
        <div className="card">
          <div className="card-title">Conversion rate by channel</div>
          {rows.map((r,i) => (
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                  <div style={{ width:8,height:8,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length] }} />
                  <span style={{ fontSize:12,fontWeight:500 }}>{r.channel}</span>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:10,color:'var(--faint)',fontFamily:'var(--mono)' }}>{fmtN(r.conversions)} from {fmtN(r.sessions)}</span>
                  <span className={`badge ${r.rate>4?'b-green':r.rate>2?'b-amber':'b-gray'}`}>{r.rate}%</span>
                </div>
              </div>
              <div className="bar-bg"><div className="bar-fill" style={{ width:`${(r.rate/maxRate)*100}%`,background:CHART_COLORS[i%CHART_COLORS.length] }} /></div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ── SEO ───────────────────────────────────────────────────────────────────────
export function SEO() {
  const [days, setDays] = useState(28);
  const [tab, setTab] = useState('keywords');
  const { data, loading, error } = useFetch(`/seo?days=${days}`, [days]);
  const PosB = ({ p }) => { const v=parseFloat(p); return <span className={`badge ${v<=3?'b-green':v<=10?'b-amber':'b-red'}`}>#{p}</span>; };
  return (
    <div>
      <div className="topbar"><div><h2>SEO Rankings</h2><div className="topbar-sub">Google Search Console</div></div><Pills value={days} onChange={setDays} options={[7,28,90]} /></div>
      {loading && <Loading />}
      {error && <Err msg={error} />}
      {!data && !loading && !error && <div className="info">SEO data requires Search Console access. Make sure you entered your site URL when connecting, and that it's verified in Google Search Console.</div>}
      {data?.error && <div className="info">{data.error}</div>}
      {data && !data.error && <>
        <div className="kgrid">
          <KCard label="Total Clicks" value={data.summary?.totalClicks} color="var(--accent)" />
          <KCard label="Impressions" value={data.summary?.totalImpressions} />
          <KCard label="Avg CTR" value={data.summary ? `${((data.summary.totalClicks/data.summary.totalImpressions)*100).toFixed(2)}%` : '0%'} />
          <KCard label="Avg Position" value={data.summary?.avgPosition} />
        </div>
        <div style={{ display:'flex',gap:6,marginBottom:14 }}>
          {['keywords','pages','countries'].map(t=>(
            <button key={t} className={`pill ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{ textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>
        <div className="card">
          <div className="tbl-wrap"><table>
            {tab==='keywords'&&<>
              <thead><tr><th>#</th><th>Keyword</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
              <tbody>{(data.keywords||[]).map((r,i)=><tr key={i}><td style={{ color:'var(--faint)',fontFamily:'var(--mono)' }}>{i+1}</td><td style={{ fontWeight:500 }}>{r.key}</td><td style={{ color:'var(--accent)',fontWeight:500 }}>{fmtN(r.clicks)}</td><td>{fmtN(r.impressions)}</td><td><span className={`badge ${r.ctr>5?'b-green':r.ctr>2?'b-amber':'b-gray'}`}>{r.ctr}%</span></td><td><PosB p={r.position} /></td></tr>)}</tbody>
            </>}
            {tab==='pages'&&<>
              <thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
              <tbody>{(data.pages||[]).map((r,i)=><tr key={i}><td><a href={r.key} target="_blank" rel="noreferrer" style={{ color:'var(--accent)',textDecoration:'none',fontFamily:'var(--mono)',fontSize:11 }}>{r.key}</a></td><td style={{ fontWeight:500 }}>{fmtN(r.clicks)}</td><td>{fmtN(r.impressions)}</td><td><span className="badge b-gray">{r.ctr}%</span></td><td><PosB p={r.position} /></td></tr>)}</tbody>
            </>}
            {tab==='countries'&&<>
              <thead><tr><th>Country</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
              <tbody>{(data.countries||[]).map((r,i)=><tr key={i}><td style={{ fontWeight:500,textTransform:'capitalize' }}>{r.key}</td><td style={{ color:'var(--accent)',fontWeight:500 }}>{fmtN(r.clicks)}</td><td>{fmtN(r.impressions)}</td><td><span className="badge b-gray">{r.ctr}%</span></td><td><PosB p={r.position} /></td></tr>)}</tbody>
            </>}
          </table></div>
        </div>
      </>}
    </div>
  );
}
