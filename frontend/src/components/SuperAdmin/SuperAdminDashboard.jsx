import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';
import '../../styles/super-admin.css';

const API = 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');
const get   = (url) => axios.get(API + url, { headers: { Authorization: `Bearer ${token()}` } });

// ── Mini bar chart (CSS-only, no library) ─────────────────────
const TurnoutBar = ({ label, voted, total, color = '#006B3F' }) => {
    const pct = total > 0 ? Math.min(100, Math.round((voted / total) * 100)) : 0;
    return (
        <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#374151', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0, marginLeft: 8 }}>{voted.toLocaleString()} ({pct}%)</span>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.7s ease' }} />
            </div>
        </div>
    );
};

// ── Audit feed row ────────────────────────────────────────────
const AuditRow = ({ action, details, createdAt }) => {
    const colors = {
        ADMIN_LOGIN: '#006B3F', SUPER_ADMIN_LOGIN: '#006B3F',
        VOTE_CAST: '#1d4ed8',
        ELECTION_LOCKED: '#92400e', ELECTION_UNLOCKED: '#006B3F',
        ELECTION_STATUS_UPDATED: '#7c3aed',
        CANDIDATE_ADDED: '#0369a1',
    };
    const color = colors[action] || '#6b7280';
    const relTime = (d) => {
        const secs = Math.floor((Date.now() - new Date(d)) / 1000);
        if (secs < 60)   return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
        if (secs < 86400)return `${Math.floor(secs/3600)}h ago`;
        return new Date(d).toLocaleDateString('en-KE');
    };
    return (
        <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111', marginBottom: 1 }}>{action.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{details}</div>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{relTime(createdAt)}</div>
        </div>
    );
};

// ── Dashboard ─────────────────────────────────────────────────
const SuperAdminDashboard = () => {
    const [adminData, setAdminData]     = useState(null);
    const [stats, setStats]             = useState({});
    const [recentAdmins, setAdmins]     = useState([]);
    const [countyTurnout, setCounty]    = useState([]);
    const [auditFeed, setAudit]         = useState([]);
    const [loading, setLoading]         = useState(true);

    const load = useCallback(async () => {
        try {
            setAdminData(JSON.parse(localStorage.getItem('user') || '{}'));
            const [statsRes, adminsRes, countyRes, auditRes] = await Promise.allSettled([
                get('/super-admin/statistics'),
                get('/super-admin/admins'),
                get('/super-admin/county-turnout'),
                get('/super-admin/audit-logs?limit=20'),
            ]);
            if (statsRes.status  === 'fulfilled') setStats(statsRes.value.data.statistics   || {});
            if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value.data.admins?.slice(0,5) || []);
            if (countyRes.status === 'fulfilled') setCounty(countyRes.value.data.turnout    || []);
            if (auditRes.status  === 'fulfilled') setAudit(auditRes.value.data.logs?.slice(0,15) || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

    const statCards = [
        { title: 'System Admins',     value: stats.total_admins,         icon: '👨‍💼', top: '#1E3C72' },
        { title: 'Registered Voters', value: stats.total_voters,         icon: '👥',  top: '#006B3F' },
        { title: 'Counties',          value: stats.total_counties,        icon: '🗺️', top: '#F59E0B' },
        { title: 'Constituencies',    value: stats.total_constituencies,  icon: '📍',  top: '#8B5CF6' },
        { title: 'Wards',             value: stats.total_wards,           icon: '🏘️', top: '#EC4899' },
        { title: 'Political Parties', value: stats.total_parties,         icon: '🎭',  top: '#F97316' },
        { title: 'Candidates',        value: stats.total_candidates,      icon: '👥',  top: '#A855F7' },
        { title: 'Votes Cast',        value: stats.total_votes_cast,      icon: '🗳️', top: '#006B3F' },
    ];

    if (loading) return (
        <SuperAdminLayout>
            <div className="sa-loading" style={{ minHeight: 300 }}>
                <div className="sa-spin">⛓️</div>
                <p>Loading dashboard…</p>
            </div>
        </SuperAdminLayout>
    );

    const name = adminData?.name || `${adminData?.first_name || ''} ${adminData?.last_name || ''}`.trim() || 'Super Admin';

    return (
        <SuperAdminLayout>
            <div className="sa-page">

                {/* Welcome */}
                <div style={{ background: 'linear-gradient(135deg, #0f1215, #1a2330)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Welcome back, {name}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                            Super Administrator · Full System Access · ID: {adminData?.nationalId || '—'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ background: 'rgba(0,107,63,0.25)', border: '1px solid rgba(0,107,63,0.4)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'sa-pulse 2s infinite' }} />
                            System Online
                        </div>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="sa-stats-grid" style={{ marginBottom: 28 }}>
                    {statCards.map(s => (
                        <div key={s.title} className="sa-stat" style={{ borderTopColor: s.top }}>
                            <div className="sa-stat-icon">{s.icon}</div>
                            <div className="sa-stat-val">{Number(s.value || 0).toLocaleString()}</div>
                            <div className="sa-stat-label">{s.title}</div>
                        </div>
                    ))}
                </div>

                {/* Two-column lower section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Turnout by county */}
                    <div className="sa-card">
                        <div className="sa-card-header">
                            <div className="sa-card-title">📊 Turnout by County</div>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>Votes cast vs. registered voters</span>
                        </div>
                        <div className="sa-card-body">
                            {countyTurnout.length > 0
                                ? countyTurnout.map((c, i) => (
                                    <TurnoutBar key={i} label={c.county_name} voted={parseInt(c.votes_cast)} total={parseInt(c.registered_voters)} color={i % 3 === 0 ? '#006B3F' : i % 3 === 1 ? '#CE1126' : '#D4A017'} />
                                ))
                                : (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 13 }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>📍</div>
                                        No vote data yet. Turnout per county will appear here once voting begins.
                                    </div>
                                )
                            }
                        </div>
                    </div>

                    {/* Live audit feed */}
                    <div className="sa-card">
                        <div className="sa-card-header">
                            <div className="sa-card-title">📋 Live Activity Feed</div>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>Recent system events</span>
                        </div>
                        <div className="sa-card-body" style={{ maxHeight: 340, overflowY: 'auto' }}>
                            {auditFeed.length > 0
                                ? auditFeed.map((log, i) => (
                                    <AuditRow key={i} action={log.action} details={log.details} createdAt={log.created_at} />
                                ))
                                : (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: 13 }}>
                                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                                        No activity logged yet.
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>

                {/* Recent Admins */}
                <div className="sa-card" style={{ marginTop: 20 }}>
                    <div className="sa-card-header">
                        <div className="sa-card-title">👨‍💼 System Administrators</div>
                    </div>
                    <div className="sa-table-wrap">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>National ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAdmins.length > 0 ? recentAdmins.map(a => (
                                    <tr key={a.id}>
                                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.national_id}</td>
                                        <td style={{ fontWeight: 500 }}>{a.first_name} {a.last_name}</td>
                                        <td><span className={`sa-badge ${a.role === 'super_admin' ? 'gold' : 'blue'}`}>{a.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></td>
                                        <td><span className={`sa-badge ${a.is_active ? 'green' : 'red'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                                        <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(a.created_at).toLocaleDateString('en-KE')}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>No administrators found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminDashboard;
