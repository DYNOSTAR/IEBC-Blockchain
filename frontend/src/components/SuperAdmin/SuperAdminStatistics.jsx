import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const fmt  = (v) => Number(v || 0).toLocaleString();
const pct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';

const HBar = ({ label, value, max, color = '#4F46E5', sub }) => {
    const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="sa-chart-bar">
            <div className="sa-chart-bar-header">
                <span className="sa-chart-bar-label">{label}</span>
                <span className="sa-chart-bar-val">{fmt(value)}{sub ? ` · ${sub}` : ''}</span>
            </div>
            <div className="sa-chart-bar-track">
                <div className="sa-chart-bar-fill" style={{ width: `${w}%`, background: color }} />
            </div>
        </div>
    );
};

const COLORS = ['#4F46E5','#DC2626','#D97706','#16A34A','#2563EB','#7C3AED','#0891B2','#D97706'];

const SuperAdminStatistics = () => {
    const [stats,   setStats]   = useState({});
    const [county,  setCounty]  = useState([]);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            axios.get(`${API}/super-admin/statistics`, auth()),
            axios.get(`${API}/super-admin/county-turnout`, auth()),
            axios.get(`${API}/super-admin/parties`, auth()),
        ]).then(([s, c, p]) => {
            if (s.status === 'fulfilled') setStats(s.value.data.statistics || {});
            if (c.status === 'fulfilled') setCounty(c.value.data.turnout   || []);
            if (p.status === 'fulfilled') setParties(p.value.data.parties  || []);
        }).finally(() => setLoading(false));
    }, []);

    const totalVoters = parseInt(stats.total_voters     || 0);
    const votesCast   = parseInt(stats.total_votes_cast || 0);
    const maxCounty   = Math.max(...county.map(c => parseInt(c.votes_cast || 0)), 1);
    const maxParty    = Math.max(...parties.map(p => parseInt(p.candidate_count || 0)), 1);
    const turnoutPct  = parseFloat(pct(votesCast, totalVoters));

    if (loading) return (
        <SuperAdminLayout>
            <div className="sa-loading"><div className="sa-spin">↻</div><p>Loading…</p></div>
        </SuperAdminLayout>
    );

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">Statistics</h1>
                        <p className="sa-page-sub">System-wide data and election metrics</p>
                    </div>
                </div>

                {/* Summary strip */}
                <div className="sa-stats-grid" style={{ marginBottom: 24 }}>
                    {[
                        { label: 'Registered Voters', val: fmt(stats.total_voters),      cls: 'green' },
                        { label: 'Votes Cast',         val: fmt(stats.total_votes_cast),  cls: '' },
                        { label: 'Turnout',            val: turnoutPct + '%',             cls: '' },
                        { label: 'Candidates',         val: fmt(stats.total_candidates),  cls: '' },
                        { label: 'Counties',           val: fmt(stats.total_counties),    cls: 'amber' },
                        { label: 'Parties',            val: fmt(stats.total_parties),     cls: '' },
                    ].map(s => (
                        <div key={s.label} className={`sa-stat ${s.cls}`}>
                            <div className="sa-stat-val">{s.val}</div>
                            <div className="sa-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Turnout by county */}
                    <div className="sa-card">
                        <div className="sa-card-header">
                            <div><div className="sa-card-title">Turnout by County</div><div className="sa-card-sub">Votes cast</div></div>
                        </div>
                        <div className="sa-card-body" style={{ maxHeight: 340, overflowY: 'auto' }}>
                            {county.length > 0
                                ? county.map((c, i) => <HBar key={i} label={c.county_name} value={parseInt(c.votes_cast)} max={maxCounty} color={COLORS[i % COLORS.length]} sub={pct(c.votes_cast, totalVoters) + '%'} />)
                                : <div className="sa-empty" style={{ padding: 24 }}><div className="sa-empty-icon">📍</div><div className="sa-empty-sub">Turnout data will appear once voting begins</div></div>
                            }
                        </div>
                    </div>

                    {/* Party candidates */}
                    <div className="sa-card">
                        <div className="sa-card-header">
                            <div><div className="sa-card-title">Candidates per Party</div><div className="sa-card-sub">Registered candidates</div></div>
                        </div>
                        <div className="sa-card-body">
                            {parties.length > 0
                                ? parties.map((p, i) => <HBar key={i} label={p.name} value={parseInt(p.candidate_count || 0)} max={maxParty} color={p.color || COLORS[i % COLORS.length]} />)
                                : <div className="sa-empty" style={{ padding: 24 }}><div className="sa-empty-icon">🎭</div><div className="sa-empty-sub">No parties registered yet</div></div>
                            }
                        </div>
                    </div>

                    {/* Voting progress ring */}
                    <div className="sa-card">
                        <div className="sa-card-header"><div className="sa-card-title">Voting Progress</div></div>
                        <div className="sa-card-body" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                            <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%' }}>
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4F46E5" strokeWidth="4"
                                        strokeDasharray={`${Math.min(100, turnoutPct)} 100`}
                                        strokeLinecap="round" style={{ transition: 'stroke-dasharray .8s ease' }} />
                                </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 28, fontWeight: 800, color: '#4F46E5', marginBottom: 4 }}>{turnoutPct}%</div>
                                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>Overall turnout</div>
                                <HBar label="Voted"      value={votesCast}             max={totalVoters} color="#4F46E5" />
                                <HBar label="Not voted"  value={totalVoters-votesCast} max={totalVoters} color="#E2E8F0" />
                            </div>
                        </div>
                    </div>

                    {/* Geography */}
                    <div className="sa-card">
                        <div className="sa-card-header"><div className="sa-card-title">Geographic Coverage</div></div>
                        <div className="sa-card-body">
                            {[
                                { label: 'Counties',         val: stats.total_counties,       color: '#4F46E5' },
                                { label: 'Constituencies',   val: stats.total_constituencies, color: '#7C3AED' },
                                { label: 'Wards',            val: stats.total_wards,          color: '#2563EB' },
                                { label: 'Administrators',   val: stats.total_admins,         color: '#D97706' },
                            ].map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: '#374151' }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{fmt(s.val)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminStatistics;
