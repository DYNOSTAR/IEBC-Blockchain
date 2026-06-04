import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const ACTION = {
    VOTE_CAST:               { color: '#1D4ED8', label: 'Vote cast' },
    ADMIN_LOGIN:             { color: '#00763C', label: 'Admin login' },
    SUPER_ADMIN_LOGIN:       { color: '#00763C', label: 'SA login' },
    ELECTION_LOCKED:         { color: '#B45309', label: 'Election locked' },
    ELECTION_UNLOCKED:       { color: '#00763C', label: 'Election unlocked' },
    ELECTION_STATUS_UPDATED: { color: '#7C3AED', label: 'Status updated' },
    ELECTION_CREATED:        { color: '#0891B2', label: 'Election created' },
    ADMIN_CREATED:           { color: '#1D4ED8', label: 'Admin created' },
    CANDIDATE_ADDED:         { color: '#0891B2', label: 'Candidate added' },
};
const meta  = (a) => ACTION[a] || { color: '#9CA3AF', label: (a||'').replace(/_/g,' ') };
const rel   = (d) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return new Date(d).toLocaleDateString('en-KE');
};
const PAGE = 50;

const AuditLogs = () => {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [action,  setAction]  = useState('');
    const [page,    setPage]    = useState(1);
    const [live,    setLive]    = useState(false);

    const load = async () => {
        try {
            const r = await axios.get(`${API}/admin/audit-logs?limit=300`, auth());
            setLogs(r.data.logs || r.data.auditLogs || []);
        } catch { setLogs([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line
    useEffect(() => { if (!live) return; const t = setInterval(load, 15000); return () => clearInterval(t); }, [live]); // eslint-disable-line

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return logs.filter(l => {
            if (q && !`${l.action||''} ${l.details||''} ${l.first_name||''} ${l.last_name||''} ${l.email||''}`.toLowerCase().includes(q)) return false;
            if (action && l.action !== action) return false;
            return true;
        });
    }, [logs, search, action]);

    const pages = Math.ceil(filtered.length / PAGE);
    const paged = filtered.slice((page-1)*PAGE, page*PAGE);

    if (loading) return <AdminLayout><div className="adm-loading"><div className="adm-spinner" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="adm-page">
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">Audit logs</h1>
                        <p className="adm-page-sub">{logs.length.toLocaleString()} events recorded</p>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                        <button className={`adm-btn ${live?'primary':'secondary'}`} onClick={()=>setLive(s=>!s)}>
                            <span style={{ width:6,height:6,borderRadius:'50%',background:live?'#fff':'var(--r)',display:'inline-block',animation:live?'live-pulse 2s infinite':'none' }} />
                            {live ? 'Pause' : 'Live'}
                        </button>
                        <button className="adm-btn secondary" onClick={load}><Icon name="arrow" size={13} /> Refresh</button>
                    </div>
                </div>

                {/* Action type chips */}
                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:14 }}>
                    <button onClick={()=>{setAction('');setPage(1);}} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, border:`1px solid ${!action?'var(--g)':'var(--border)'}`, background:!action?'var(--g)':'var(--surface)', color:!action?'#fff':'var(--t3)', cursor:'pointer', fontWeight:500 }}>
                        All
                    </button>
                    {Object.entries(ACTION).map(([k,m]) => (
                        <button key={k} onClick={()=>{setAction(action===k?'':k);setPage(1);}} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, border:`1px solid ${action===k?m.color:'var(--border)'}`, background:action===k?m.color:'var(--surface)', color:action===k?'#fff':'var(--t3)', cursor:'pointer', fontWeight:500 }}>
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="adm-filter-row">
                    <div className="adm-search-box" style={{ maxWidth:380 }}>
                        <Icon name="search" size={14} className="adm-search-icon" />
                        <input placeholder="Search by action, details, or user…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
                    </div>
                    <span style={{ marginLeft:'auto', fontSize:12, color:'var(--t3)' }}>{filtered.length.toLocaleString()} events</span>
                </div>

                <div className="adm-card">
                    {pages > 1 && (
                        <div className="adm-card-head" style={{ padding:'8px 14px' }}>
                            <span style={{ fontSize:12, color:'var(--t3)' }}>Showing {paged.length} of {filtered.length}</span>
                            <div style={{ display:'flex', gap:6 }}>
                                <button className="adm-btn secondary" style={{ padding:'3px 9px',fontSize:12 }} onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>←</button>
                                <span style={{ fontSize:12, color:'var(--t3)' }}>{page}/{pages}</span>
                                <button className="adm-btn secondary" style={{ padding:'3px 9px',fontSize:12 }} onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>→</button>
                            </div>
                        </div>
                    )}
                    <div style={{ padding:'0 16px 8px' }}>
                        {paged.length === 0
                            ? <div className="adm-empty" style={{ padding:'32px 0' }}><div className="adm-empty-icon"><Icon name="logs" size={28} /></div><div className="adm-empty-sub">No events match this filter</div></div>
                            : paged.map((log, i) => {
                                const m = meta(log.action);
                                const actor = log.first_name ? `${log.first_name} ${log.last_name||''}`.trim() : log.email || `User #${log.user_id||'?'}`;
                                return (
                                    <div key={log.id||i} className="adm-timeline-row">
                                        <div className="adm-timeline-dot" style={{ background:m.color }} />
                                        <div className="adm-timeline-body">
                                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <span className="adm-timeline-action">{m.label}</span>
                                                {log.email && <span style={{ fontSize:10, color:'var(--t4)', fontFamily:'monospace' }}>{log.email}</span>}
                                            </div>
                                            {log.details && <div className="adm-timeline-detail">{log.details}</div>}
                                            <div className="adm-timeline-actor">{actor}{log.ip_address && <span style={{ marginLeft:8, fontFamily:'monospace', fontSize:10, color:'var(--t4)' }}>{log.ip_address}</span>}</div>
                                        </div>
                                        <div style={{ textAlign:'right', flexShrink:0 }}>
                                            <div className="adm-timeline-time">{rel(log.created_at||log.timestamp)}</div>
                                            <div style={{ fontSize:10, color:'var(--t4)', fontFamily:'monospace', marginTop:1 }}>#{log.id}</div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AuditLogs;
