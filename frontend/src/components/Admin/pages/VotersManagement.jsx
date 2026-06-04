import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const PAGE = 30;

const VER = { 0: { l: 'Unverified', c: 'closed' }, 1: { l: 'OTP', c: 'pending' }, 2: { l: 'ID Card', c: 'pending' }, 3: { l: 'Face', c: 'pending' }, 4: { l: 'Biometric', c: 'active' } };

const VotersManagement = () => {
    const [voters,   setVoters]   = useState([]);
    const [counties, setCounties] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [county,   setCounty]   = useState('');
    const [status,   setStatus]   = useState('');
    const [page,     setPage]     = useState(1);
    const [selected, setSelected] = useState(null);  // voter for drawer

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/admin/voters`, auth()),
            axios.get(`${API}/counties`, auth()),
        ]).then(([v, c]) => {
            setVoters(v.data.voters || v.data || []);
            setCounties(c.data.counties || []);
        }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return voters.filter(v => {
            const fullName = `${v.first_name||''} ${v.last_name||''}`.toLowerCase();
            if (q && !fullName.includes(q) && !(v.national_id||'').includes(q) && !(v.email||'').toLowerCase().includes(q)) return false;
            if (county && String(v.county_id) !== county) return false;
            if (status === 'voted'     && !v.has_voted)   return false;
            if (status === 'not_voted' && v.has_voted)    return false;
            if (status === 'verified'  && !v.is_verified) return false;
            return true;
        });
    }, [voters, search, county, status]);

    const pages = Math.ceil(filtered.length / PAGE);
    const paged = filtered.slice((page-1)*PAGE, page*PAGE);

    const voted    = voters.filter(v => v.has_voted).length;
    const verified = voters.filter(v => v.is_verified).length;

    if (loading) return <AdminLayout><div className="adm-loading"><div className="adm-spinner" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="adm-page">
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">Voters</h1>
                        <p className="adm-page-sub">{voters.length.toLocaleString()} registered voters</p>
                    </div>
                    <button className="adm-btn secondary"
                        onClick={() => {
                            const csv = [['National ID','Name','Email','County','Voted','Verified'],
                                ...filtered.map(v => [v.national_id, `${v.first_name||''} ${v.last_name||''}`.trim(), v.email||'', v.county_name||'', v.has_voted?'Yes':'No', v.is_verified?'Yes':'No'])
                            ].map(r => r.join(',')).join('\n');
                            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
                            a.download = 'voters.csv'; a.click();
                        }}>
                        <Icon name="arrow" size={14} /> Export CSV
                    </button>
                </div>

                {/* Metric strip — 4 cards */}
                <div className="adm-metrics" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                    {[
                        { label: 'Total Voters',   value: voters.length.toLocaleString(),      icon: 'users',   chip: '' },
                        { label: 'Voted',          value: voted.toLocaleString(),              icon: 'check',   chip: '' },
                        { label: 'Not Yet Voted',  value: (voters.length - voted).toLocaleString(), icon: 'alert', chip: 'amber' },
                        { label: 'Verified',       value: verified.toLocaleString(),           icon: 'lock',    chip: '' },
                    ].map(m => (
                        <div key={m.label} className="adm-metric-card">
                            <div className={`adm-metric-chip ${m.chip}`}><Icon name={m.icon} size={16} /></div>
                            <div className="adm-metric-body">
                                <div className="adm-metric-value">{m.value}</div>
                                <div className="adm-metric-label">{m.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="adm-filter-row">
                    <div className="adm-search-box" style={{ maxWidth: 320 }}>
                        <Icon name="search" size={14} className="adm-search-icon" />
                        <input placeholder="Name, national ID, or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select className="adm-select" style={{ width: 160, height: 36 }} value={county} onChange={e => { setCounty(e.target.value); setPage(1); }}>
                        <option value="">All counties</option>
                        {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="adm-select" style={{ width: 140, height: 36 }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All status</option>
                        <option value="voted">Voted</option>
                        <option value="not_voted">Not voted</option>
                        <option value="verified">Verified</option>
                    </select>
                    {(search || county || status) && (
                        <button className="adm-btn ghost" onClick={() => { setSearch(''); setCounty(''); setStatus(''); setPage(1); }}>
                            <Icon name="x" size={13} /> Clear
                        </button>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--t3)' }}>{filtered.length.toLocaleString()} matching</span>
                </div>

                <div className="adm-card">
                    {/* Pagination header */}
                    {pages > 1 && (
                        <div className="adm-card-head" style={{ padding: '8px 14px' }}>
                            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Page {page} of {pages}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="adm-btn secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>←</button>
                                <button className="adm-btn secondary" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages}>→</button>
                            </div>
                        </div>
                    )}
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Voter</th>
                                    <th>National ID</th>
                                    <th>Phone</th>
                                    <th>County</th>
                                    <th>Voted</th>
                                    <th>Verification</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--t4)' }}>No voters match these filters</td></tr>
                                )}
                                {paged.map(v => {
                                    const name = `${v.first_name||''} ${v.last_name||''}`.trim() || '—';
                                    const initials = name.split(' ').map(p=>p[0]||'').slice(0,2).join('').toUpperCase() || '?';
                                    const ver = VER[v.verification_level||0] || VER[0];
                                    return (
                                        <tr key={v.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                    <div className="adm-avatar" style={{ background: v.has_voted ? 'var(--g)' : '#9CA3AF' }}>{initials}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--t1)' }}>{name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{v.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="adm-col-id">{v.national_id || '—'}</span></td>
                                            <td style={{ fontSize: 12, color: 'var(--t3)' }}>{v.phone || '—'}</td>
                                            <td style={{ fontSize: 12 }}>{v.county_name || '—'}</td>
                                            <td>
                                                <span className={`adm-pill ${v.has_voted ? 'active' : 'pending'}`}>
                                                    {v.has_voted ? 'Voted' : 'Pending'}
                                                </span>
                                            </td>
                                            <td><span className={`adm-pill ${ver.c}`}>{ver.l}</span></td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="adm-btn ghost icon" onClick={() => setSelected(v)}>
                                                        <Icon name="eye" size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail drawer */}
            {selected && (
                <>
                    <div className="adm-drawer-overlay" onClick={() => setSelected(null)} />
                    <div className="adm-drawer">
                        <div className="adm-drawer-head">
                            <div>
                                <div style={{ fontWeight: 500, fontSize: 15 }}>{`${selected.first_name||''} ${selected.last_name||''}`}</div>
                                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{selected.email || 'No email'}</div>
                            </div>
                            <button className="adm-modal-close" onClick={() => setSelected(null)}><Icon name="x" size={16} /></button>
                        </div>
                        <div className="adm-drawer-body">
                            {[
                                { l: 'National ID', v: selected.national_id, mono: true },
                                { l: 'Phone',       v: selected.phone },
                                { l: 'County',      v: selected.county_name },
                                { l: 'Constituency',v: selected.constituency_name },
                                { l: 'Ward',        v: selected.ward_name },
                                { l: 'Has voted',   v: selected.has_voted ? 'Yes' : 'No' },
                                { l: 'Verified',    v: selected.is_verified ? 'Yes' : 'No' },
                                { l: 'Verification level', v: VER[selected.verification_level||0]?.l },
                                { l: 'Registered',  v: selected.registered_at ? new Date(selected.registered_at).toLocaleDateString('en-KE') : '—' },
                            ].map(r => (
                                <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: 'var(--hairline)', fontSize: 13 }}>
                                    <span style={{ color: 'var(--t3)' }}>{r.l}</span>
                                    <span style={{ fontFamily: r.mono ? 'monospace' : 'inherit', fontWeight: r.mono ? 400 : 500, color: 'var(--t1)' }}>{r.v || '—'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
};

export default VotersManagement;
