import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const ACTION_META = {
    VOTE_CAST:               { color: '#2563EB', label: 'Vote Cast' },
    ADMIN_LOGIN:             { color: '#16A34A', label: 'Admin Login' },
    SUPER_ADMIN_LOGIN:       { color: '#16A34A', label: 'SA Login' },
    ELECTION_LOCKED:         { color: '#D97706', label: 'Election Locked' },
    ELECTION_UNLOCKED:       { color: '#16A34A', label: 'Election Unlocked' },
    ELECTION_STATUS_UPDATED: { color: '#7C3AED', label: 'Status Updated' },
    ELECTION_CREATED:        { color: '#0891B2', label: 'Election Created' },
    CANDIDATE_ADDED:         { color: '#0891B2', label: 'Candidate Added' },
    ADMIN_CREATED:           { color: '#4F46E5', label: 'Admin Created' },
};
const getMeta = (action) => ACTION_META[action] || { color: '#9CA3AF', label: (action || '').replace(/_/g,' ') || 'Unknown' };

const relTime = (d) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return new Date(d).toLocaleDateString('en-KE');
};

const PAGE_SIZE = 50;

const SuperAdminAuditLogs = () => {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [action,  setAction]  = useState('');
    const [page,    setPage]    = useState(1);
    const [live,    setLive]    = useState(false);

    const load = async () => {
        try {
            const r = await axios.get(`${API}/super-admin/audit-logs?limit=300`, auth());
            if (r.data.success) setLogs(r.data.logs || []);
        } catch { setLogs([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line
    useEffect(() => {
        if (!live) return;
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [live]); // eslint-disable-line

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return logs.filter(l => {
            if (q && !`${l.action||''} ${l.details||''} ${l.first_name||''} ${l.last_name||''} ${l.email||''}`.toLowerCase().includes(q)) return false;
            if (action && l.action !== action) return false;
            return true;
        });
    }, [logs, search, action]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged      = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

    if (loading) return (
        <SuperAdminLayout>
            <div className="sa-loading"><div className="sa-spin">↻</div><p>Loading audit logs…</p></div>
        </SuperAdminLayout>
    );

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">Audit Logs</h1>
                        <p className="sa-page-sub">{logs.length.toLocaleString()} events recorded</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className={`sa-btn ${live ? 'green' : 'outline'}`} onClick={() => setLive(s => !s)}>
                            {live ? '⏸ Pause' : '▶ Live'}
                        </button>
                        <button className="sa-btn outline" onClick={load}>↻ Refresh</button>
                    </div>
                </div>

                {/* Action type filter chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    <button onClick={() => { setAction(''); setPage(1); }}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${!action ? '#4F46E5' : '#E2E8F0'}`, background: !action ? '#4F46E5' : '#fff', color: !action ? '#fff' : '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
                        All
                    </button>
                    {Object.entries(ACTION_META).map(([k, m]) => (
                        <button key={k} onClick={() => { setAction(action === k ? '' : k); setPage(1); }}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${action === k ? m.color : '#E2E8F0'}`, background: action === k ? m.color : '#fff', color: action === k ? '#fff' : '#6B7280', cursor: 'pointer', fontWeight: 500 }}>
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="sa-filter-row" style={{ marginBottom: 16 }}>
                    <div className="sa-search" style={{ flex: 1, maxWidth: 400 }}>
                        <span style={{ color: '#9CA3AF', fontSize: 13 }}>🔍</span>
                        <input placeholder="Search by action, details, or user…" value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>{filtered.length.toLocaleString()} events</span>
                </div>

                {/* Timeline */}
                <div className="sa-card">
                    <div className="sa-card-header" style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>Showing {paged.length} of {filtered.length}</span>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button className="sa-btn outline" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>←</button>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>{page}/{totalPages}</span>
                                <button className="sa-btn outline" style={{ padding: '3px 9px', fontSize: 12 }} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>→</button>
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '0 16px 8px' }}>
                        {paged.length === 0
                            ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 13 }}>No events match the current filter</div>
                            : paged.map((log, i) => {
                                const meta  = getMeta(log.action);
                                const actor = log.first_name
                                    ? `${log.first_name} ${log.last_name || ''}`.trim()
                                    : log.email || `User #${log.user_id || '?'}`;
                                return (
                                    <div key={log.id || i} className="sa-timeline-row">
                                        <div className="sa-timeline-dot" style={{ background: meta.color }} />
                                        <div className="sa-timeline-body">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="sa-timeline-action">{meta.label}</span>
                                                {log.email && <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{log.email}</span>}
                                            </div>
                                            {log.details && <div className="sa-timeline-detail">{log.details}</div>}
                                            <div className="sa-timeline-meta">
                                                <span className="sa-timeline-actor">{actor}</span>
                                                {log.ip_address && <span className="sa-monospace" style={{ fontSize: 10, color: '#9CA3AF' }}>{log.ip_address}</span>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div className="sa-timeline-time">{relTime(log.created_at || log.timestamp)}</div>
                                            <div style={{ fontSize: 10, color: '#D1D5DB', fontFamily: 'monospace', marginTop: 1 }}>#{log.id}</div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminAuditLogs;
