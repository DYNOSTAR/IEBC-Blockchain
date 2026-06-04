import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import Icon from '../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const n    = (v) => Number(v || 0).toLocaleString();

// ── Action colours for activity feed ──────────────────────────
const ACTION_COLOR = {
    VOTE_CAST:               '#1D4ED8', ADMIN_LOGIN:             '#00763C',
    ELECTION_LOCKED:         '#B45309', ELECTION_UNLOCKED:       '#00763C',
    ELECTION_STATUS_UPDATED: '#7C3AED', ELECTION_CREATED:        '#0891B2',
};
const actColor = (a) => ACTION_COLOR[a] || '#9CA3AF';
const relTime = (d) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return new Date(d).toLocaleDateString('en-KE');
};

// ── Bar chart (CSS only) ───────────────────────────────────────
const HBar = ({ label, value, max, color = 'var(--g)' }) => (
    <div className="adm-bar">
        <div className="adm-bar-header">
            <span className="adm-bar-label">{label}</span>
            <span className="adm-bar-val">{n(value)}</span>
        </div>
        <div className="adm-bar-track">
            <div className="adm-bar-fill" style={{ width: max > 0 ? `${Math.min(100,(value/max)*100)}%` : '0%', background: color }} />
        </div>
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats,   setStats]   = useState({});
    const [activity,setAct]     = useState([]);
    const [county,  setCounty]  = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            axios.get(`${API}/admin/statistics`, auth()),
            axios.get(`${API}/admin/audit-logs?limit=15`, auth()),
            axios.get(`${API}/counties`, auth()),
        ]).then(([s, a, c]) => {
            if (s.status === 'fulfilled') setStats(s.value.data.statistics || s.value.data || {});
            if (a.status === 'fulfilled') setAct(a.value.data.logs || a.value.data.auditLogs || []);
            if (c.status === 'fulfilled') setCounty(c.value.data.counties || []);
        }).finally(() => setLoading(false));
    }, []);

    const totalVoters = parseInt(stats.total_voters || 0);
    const votesCast   = parseInt(stats.total_votes_cast || 0);
    const turnout     = totalVoters > 0 ? ((votesCast / totalVoters) * 100).toFixed(1) : '0.0';

    const METRICS = [
        { label: 'Registered Voters', value: n(stats.total_voters),      icon: 'users',     chip: '' },
        { label: 'Votes Cast',         value: n(stats.total_votes_cast),   icon: 'check',     chip: '' },
        { label: 'Voter Turnout',       value: `${turnout}%`,              icon: 'trending-up',chip: '' },
        { label: 'Active Elections',    value: n(stats.total_elections || stats.active_elections || '—'), icon: 'election', chip: '' },
        { label: 'Counties',            value: n(stats.total_counties),    icon: 'county',    chip: 'amber' },
        { label: 'Constituencies',      value: n(stats.total_constituencies),icon:'constituency',chip: 'amber' },
        { label: 'Candidates',          value: n(stats.total_candidates),  icon: 'candidates',chip: '' },
        { label: 'Political Parties',   value: n(stats.total_parties),     icon: 'party',     chip: '' },
    ];

    const QUICK = [
        { label: 'Manage Elections', icon: 'election', path: '/admin/reports' },
        { label: 'View Results',     icon: 'results',  path: '/admin/results' },
        { label: 'Candidates',       icon: 'candidates',path:'/admin/candidates' },
        { label: 'Voters',           icon: 'users',    path: '/admin/voters' },
    ];

    if (loading) return (
        <AdminLayout>
            <div className="adm-loading"><div className="adm-spinner" /></div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="adm-page">
                {/* Header */}
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">Dashboard</h1>
                        <p className="adm-page-sub">At-a-glance system overview</p>
                    </div>
                    <button className="adm-btn primary" onClick={() => navigate('/admin/reports')}>
                        <Icon name="plus" size={14} />
                        New Election
                    </button>
                </div>

                {/* Metric cards — 4 per row */}
                <div className="adm-metrics">
                    {METRICS.map(m => (
                        <div key={m.label} className="adm-metric-card">
                            <div className={`adm-metric-chip ${m.chip}`}>
                                <Icon name={m.icon} size={16} />
                            </div>
                            <div className="adm-metric-body">
                                <div className="adm-metric-value">{m.value}</div>
                                <div className="adm-metric-label">{m.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div className="adm-card" style={{ marginBottom: 20 }}>
                    <div className="adm-card-head">
                        <div className="adm-card-title">Quick actions</div>
                    </div>
                    <div className="adm-card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {QUICK.map(q => (
                            <button key={q.path} className="adm-btn secondary"
                                style={{ gap: 8, padding: '9px 16px', borderRadius: 8 }}
                                onClick={() => navigate(q.path)}>
                                <Icon name={q.icon} size={15} color="var(--g)" />
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Two-column: chart + activity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* County turnout bars */}
                    <div className="adm-card">
                        <div className="adm-card-head">
                            <div>
                                <div className="adm-card-title">Turnout overview</div>
                                <div className="adm-card-sub">Votes cast · current election</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--t1)' }}>{turnout}%</div>
                                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{n(votesCast)} of {n(totalVoters)}</div>
                            </div>
                        </div>
                        <div className="adm-card-body">
                            {/* Overall progress ring */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }}>
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="4" />
                                        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--g)" strokeWidth="4"
                                            strokeDasharray={`${Math.min(100, parseFloat(turnout))} 100`}
                                            strokeLinecap="round" style={{ transition: 'stroke-dasharray .8s ease' }} />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, color: 'var(--t2)' }}>Registered: <strong>{n(totalVoters)}</strong></div>
                                    <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 2 }}>Voted: <strong style={{ color: 'var(--g)' }}>{n(votesCast)}</strong></div>
                                    <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 2 }}>Pending: {n(totalVoters - votesCast)}</div>
                                </div>
                            </div>
                            {/* County bars */}
                            {county.length > 0 && (
                                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                    {county.map((c, i) => (
                                        <HBar key={i} label={c.name} value={parseInt(c.registered_voters || 0)}
                                            max={Math.max(...county.map(x => parseInt(x.registered_voters || 0)), 1)} />
                                    ))}
                                </div>
                            )}
                            {county.length === 0 && (
                                <div style={{ fontSize: 12, color: 'var(--t4)', textAlign: 'center', padding: '16px 0' }}>
                                    County turnout data will appear once voting begins
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity feed */}
                    <div className="adm-card">
                        <div className="adm-card-head">
                            <div className="adm-card-title">Recent activity</div>
                            <button className="adm-btn ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                                onClick={() => navigate('/admin/audit-logs')}>
                                View all
                            </button>
                        </div>
                        <div className="adm-card-body" style={{ maxHeight: 340, overflowY: 'auto' }}>
                            {activity.length > 0
                                ? activity.map((log, i) => (
                                    <div key={i} className="adm-timeline-row">
                                        <div className="adm-timeline-dot" style={{ background: actColor(log.action) }} />
                                        <div className="adm-timeline-body">
                                            <div className="adm-timeline-action">
                                                {(log.action || '').replace(/_/g, ' ')}
                                            </div>
                                            {log.details && <div className="adm-timeline-detail">{log.details}</div>}
                                            {(log.first_name || log.email) && (
                                                <div className="adm-timeline-actor">
                                                    {log.first_name ? `${log.first_name} ${log.last_name || ''}`.trim() : log.email}
                                                </div>
                                            )}
                                        </div>
                                        <div className="adm-timeline-time">{relTime(log.created_at || log.timestamp)}</div>
                                    </div>
                                ))
                                : (
                                    <div className="adm-empty" style={{ padding: '32px 0' }}>
                                        <div className="adm-empty-icon"><Icon name="activity" size={28} color="var(--border-md)" /></div>
                                        <div className="adm-empty-sub">No activity recorded yet</div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
