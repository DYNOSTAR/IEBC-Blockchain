import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const PAGE_SIZE = 25;

const VerBadge = ({ level }) => {
    const labels = { 0: 'Unverified', 1: 'OTP', 2: 'ID Card', 3: 'Face', 4: 'Biometric' };
    const colors = { 0: 'grey', 1: 'amber', 2: 'amber', 3: 'blue', 4: 'green' };
    return <span className={`sa-badge ${colors[level] || 'grey'}`}>{labels[level] || 'Unknown'}</span>;
};

const SuperAdminVoters = () => {
    const [voters,   setVoters]   = useState([]);
    const [counties, setCounties] = useState([]);
    const [consts,   setConsts]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [county,   setCounty]   = useState('');
    const [constId,  setConstId]  = useState('');
    const [status,   setStatus]   = useState('');
    const [page,     setPage]     = useState(1);

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/super-admin/voters`, auth()),
            axios.get(`${API}/super-admin/counties`, auth()),
        ]).then(([v, c]) => {
            setVoters(v.data.voters || []);
            setCounties(c.data.counties || []);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setConstId(''); setConsts([]);
        if (!county) return;
        axios.get(`${API}/super-admin/constituencies/by-county/${county}`, auth()).then(r => {
            setConsts(r.data.constituencies || []);
        }).catch(() => {});
    }, [county]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return voters.filter(v => {
            if (q && !`${v.full_name || ''} ${v.national_id || ''} ${v.email || ''}`.toLowerCase().includes(q)) return false;
            if (county  && String(v.county_id) !== county) return false;
            if (constId && String(v.constituency_id) !== constId) return false;
            if (status === 'voted'     && !v.has_voted) return false;
            if (status === 'not_voted' && v.has_voted)  return false;
            if (status === 'verified'  && !v.is_verified) return false;
            return true;
        });
    }, [voters, search, county, constId, status]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged      = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

    const stats = useMemo(() => ({
        total:    voters.length,
        voted:    voters.filter(v => v.has_voted).length,
        verified: voters.filter(v => v.is_verified).length,
    }), [voters]);

    if (loading) return <SuperAdminLayout><div className="sa-loading"><div className="sa-spin">↻</div></div></SuperAdminLayout>;

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">Voters Registry</h1>
                        <p className="sa-page-sub">{voters.length.toLocaleString()} registered voters</p>
                    </div>
                    <button className="sa-btn outline" onClick={() => {
                        const csv = [['National ID','Name','Email','County','Voted','Verified'],
                            ...filtered.map(v => [v.national_id, v.full_name || `${v.first_name||''} ${v.last_name||''}`, v.email||'', v.county_name||'', v.has_voted?'Yes':'No', v.is_verified?'Yes':'No'])
                        ].map(r => r.join(',')).join('\n');
                        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
                        a.download = 'voters.csv'; a.click();
                    }}>↓ Export CSV</button>
                </div>

                {/* Quick stats */}
                <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
                    <div className="sa-stat green"><div className="sa-stat-val">{stats.voted.toLocaleString()}</div><div className="sa-stat-label">Voted</div></div>
                    <div className="sa-stat amber"><div className="sa-stat-val">{(stats.total - stats.voted).toLocaleString()}</div><div className="sa-stat-label">Not Voted</div></div>
                    <div className="sa-stat"><div className="sa-stat-val">{stats.verified.toLocaleString()}</div><div className="sa-stat-label">Verified</div></div>
                </div>

                {/* Filters */}
                <div className="sa-filter-row">
                    <div className="sa-search" style={{ flex: 1, maxWidth: 340 }}>
                        <span style={{ color: '#9CA3AF', fontSize: 13 }}>🔍</span>
                        <input placeholder="Name, national ID, or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="sa-select" style={{ width: 160, height: 36 }} value={county} onChange={e => { setCounty(e.target.value); setPage(1); }}>
                        <option value="">All Counties</option>
                        {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="sa-select" style={{ width: 180, height: 36 }} value={constId} disabled={!county} onChange={e => { setConstId(e.target.value); setPage(1); }}>
                        <option value="">{county ? 'All Constituencies' : 'Select county first'}</option>
                        {consts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="sa-select" style={{ width: 140, height: 36 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All status</option>
                        <option value="voted">Voted</option>
                        <option value="not_voted">Not voted</option>
                        <option value="verified">Verified</option>
                    </select>
                    {(search || county || constId || status) && (
                        <button className="sa-btn ghost" onClick={() => { setSearch(''); setCounty(''); setConstId(''); setStatus(''); setPage(1); }}>Clear</button>
                    )}
                </div>

                {/* Table */}
                <div className="sa-card">
                    <div className="sa-card-header" style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{filtered.length.toLocaleString()} voters matching filters</span>
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button className="sa-btn outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>←</button>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>{page}/{totalPages}</span>
                                <button className="sa-btn outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>→</button>
                            </div>
                        )}
                    </div>
                    <div className="sa-table-wrap">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Voter</th>
                                    <th>National ID</th>
                                    <th>Phone</th>
                                    <th>County</th>
                                    <th>Constituency</th>
                                    <th>Ward</th>
                                    <th>Voted</th>
                                    <th>Verification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(v => (
                                    <tr key={v.id || v.national_id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>
                                                {v.full_name || `${v.first_name||''} ${v.last_name||''}`.trim() || '—'}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#6B7280' }}>{v.email || '—'}</div>
                                        </td>
                                        <td><span className="sa-monospace">{v.national_id || '—'}</span></td>
                                        <td style={{ color: '#6B7280', fontSize: 12 }}>{v.phone || '—'}</td>
                                        <td style={{ fontSize: 12 }}>{v.county_name || '—'}</td>
                                        <td style={{ fontSize: 12 }}>{v.constituency_name || '—'}</td>
                                        <td style={{ fontSize: 12 }}>{v.ward_name || '—'}</td>
                                        <td>
                                            {v.has_voted
                                                ? <span className="pill-active">Voted</span>
                                                : <span className="pill-pending">Pending</span>}
                                        </td>
                                        <td><VerBadge level={v.verification_level || 0} /></td>
                                    </tr>
                                ))}
                                {paged.length === 0 && (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No voters match these filters</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminVoters;
