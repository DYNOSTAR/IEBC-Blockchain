import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const fmt  = (v) => Number(v || 0).toLocaleString();

// ── Shared GeoTable for counties / constituencies / wards ──────
const GeoTable = ({ rows, columns, onRowClick, loading, rowClickable }) => (
    <div className="sa-card">
        <div className="sa-table-wrap">
            <table className="sa-table">
                <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
                <tbody>
                    {loading && <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>Loading…</td></tr>}
                    {!loading && rows.length === 0 && <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No records found</td></tr>}
                    {rows.map((row, i) => (
                        <tr key={row.id || i} onClick={() => rowClickable && onRowClick?.(row)}
                            style={{ cursor: rowClickable ? 'pointer' : 'default' }}>
                            {columns.map(c => (
                                <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// ── Modal for add/edit ─────────────────────────────────────────
const GeoModal = ({ title, fields, onClose, onSubmit, submitting }) => {
    const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default || ''])));
    return (
        <div className="sa-modal-overlay">
            <div className="sa-modal">
                <div className="sa-modal-head"><h3>{title}</h3><button className="sa-modal-close" onClick={onClose}>✕</button></div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
                    <div className="sa-modal-body">
                        <div className="sa-form-row" style={{ gridTemplateColumns: fields.length > 2 ? '1fr 1fr' : '1fr' }}>
                            {fields.map(f => (
                                <div key={f.key} className="sa-form-group" style={f.full ? { gridColumn: '1/-1' } : {}}>
                                    <label className="sa-label">{f.label}{f.required ? ' *' : ''}</label>
                                    <input className="sa-input" required={f.required} placeholder={f.placeholder}
                                        type={f.type || 'text'} value={form[f.key]}
                                        onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="sa-modal-foot">
                        <button type="button" className="sa-btn outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="sa-btn brand" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── SuperAdminCounties ────────────────────────────────────────
const SuperAdminCounties = () => {
    const [counties, setCounties]       = useState([]);
    const [constituencies, setConst]    = useState([]);
    const [wards, setWards]             = useState([]);
    const [drill, setDrill]             = useState(null);   // { level: 'county'|'constituency', id, name }
    const [subDrill, setSubDrill]       = useState(null);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [modal, setModal]             = useState(null);   // { level, editing? }
    const [flash, setFlash]             = useState({ text: '', type: '' });
    const [submitting, setSub]          = useState(false);

    const msg = (text, type = 'ok') => { setFlash({ text, type }); setTimeout(() => setFlash({ text:'', type:'' }), 4000); };

    const loadCounties = async () => {
        setLoading(true);
        try { const r = await axios.get(`${API}/super-admin/counties`, auth()); if (r.data.success) setCounties(r.data.counties || []); }
        catch { msg('Failed to load counties', 'err'); }
        finally { setLoading(false); }
    };

    const loadConst = async (countyId) => {
        const r = await axios.get(`${API}/super-admin/constituencies`, auth());
        if (r.data.success) setConst((r.data.constituencies || []).filter(c => !countyId || c.county_id === countyId));
    };

    const loadWards = async (constId) => {
        const r = await axios.get(`${API}/super-admin/wards`, auth());
        if (r.data.success) setWards((r.data.wards || []).filter(w => !constId || w.constituency_id === constId));
    };

    useEffect(() => { loadCounties(); }, []); // eslint-disable-line

    const handleCountyClick = async (county) => {
        setDrill({ level: 'county', id: county.id, name: county.name });
        setSubDrill(null);
        await loadConst(county.id);
    };

    const handleConstClick = async (con) => {
        setSubDrill({ level: 'constituency', id: con.id, name: con.name });
        await loadWards(con.id);
    };

    const handleAdd = async (form) => {
        setSub(true);
        try {
            if (modal.level === 'county') {
                await axios.post(`${API}/super-admin/counties`, form, auth());
                msg('County added'); loadCounties();
            } else if (modal.level === 'constituency') {
                await axios.post(`${API}/super-admin/constituencies`, { ...form, county_id: drill?.id }, auth());
                msg('Constituency added'); loadConst(drill?.id);
            } else {
                await axios.post(`${API}/super-admin/wards`, { ...form, constituency_id: subDrill?.id || drill?.id }, auth());
                msg('Ward added'); loadWards(subDrill?.id);
            }
            setModal(null);
        } catch (e) { msg(e.response?.data?.error || 'Failed to save', 'err'); }
        finally { setSub(false); }
    };

    // County columns
    const countyColumns = [
        { key: 'code',              label: 'Code' },
        { key: 'name',              label: 'County' },
        { key: 'headquarters',      label: 'Headquarters' },
        { key: 'population',        label: 'Population',  render: v => fmt(v) },
        { key: 'registered_voters', label: 'Registered',  render: v => fmt(v) },
        { key: 'constituency_count',label: 'Constituencies', render: v => fmt(v) },
        { key: 'ward_count',        label: 'Wards',       render: v => fmt(v) },
    ];

    const constColumns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Constituency' },
        { key: 'ward_count', label: 'Wards', render: v => fmt(v) },
    ];

    const wardColumns = [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Ward' },
    ];

    const q = search.toLowerCase();
    const filteredCounties = counties.filter(c => !q || c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q));

    // Breadcrumbs
    const crumbs = [
        { label: 'All Counties', onClick: () => { setDrill(null); setSubDrill(null); setSearch(''); } },
        drill    && { label: drill.name,    onClick: () => { setSubDrill(null); loadConst(drill.id); } },
        subDrill && { label: subDrill.name, onClick: null },
    ].filter(Boolean);

    const currentLevel = subDrill ? 'ward' : drill ? 'constituency' : 'county';

    const addLabels = { county: 'Add County', constituency: 'Add Constituency', ward: 'Add Ward' };
    const addFields = {
        county:        [{ key:'name', label:'County Name', required:true }, { key:'code', label:'Code', required:true }, { key:'headquarters', label:'Headquarters' }, { key:'population', label:'Population', type:'number' }],
        constituency:  [{ key:'name', label:'Constituency Name', required:true }, { key:'code', label:'Code' }],
        ward:          [{ key:'name', label:'Ward Name', required:true }, { key:'code', label:'Code' }],
    };

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                {/* Header */}
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">
                            {currentLevel === 'county' ? 'Counties' : currentLevel === 'constituency' ? `${drill?.name} — Constituencies` : `${subDrill?.name} — Wards`}
                        </h1>
                        <p className="sa-page-sub">
                            {currentLevel === 'county' ? `${counties.length} counties · click a row to see its constituencies` : currentLevel === 'constituency' ? 'Click a constituency to see its wards' : 'Ward-level data'}
                        </p>
                    </div>
                    <button className="sa-btn brand" onClick={() => setModal({ level: currentLevel })}>
                        + {addLabels[currentLevel]}
                    </button>
                </div>

                {flash.text && <div className={`sa-flash ${flash.type}`}>{flash.type === 'err' ? '✗ ' : '✓ '}{flash.text}</div>}

                {/* Breadcrumb */}
                {crumbs.length > 1 && (
                    <div className="sa-breadcrumb">
                        {crumbs.map((c, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span className="sa-breadcrumb-sep">›</span>}
                                <span className={`sa-breadcrumb-item ${i === crumbs.length-1 ? 'active' : ''}`} onClick={c.onClick}>{c.label}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Search (county level only) */}
                {currentLevel === 'county' && (
                    <div className="sa-filter-row">
                        <div className="sa-search">
                            <span style={{ color: '#9CA3AF', fontSize: 13 }}>🔍</span>
                            <input placeholder="Search county or code…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Table */}
                {currentLevel === 'county' && (
                    <GeoTable rows={filteredCounties} columns={countyColumns} onRowClick={handleCountyClick} loading={loading} rowClickable />
                )}
                {currentLevel === 'constituency' && (
                    <GeoTable rows={constituencies} columns={constColumns} onRowClick={handleConstClick} loading={false} rowClickable />
                )}
                {currentLevel === 'ward' && (
                    <GeoTable rows={wards} columns={wardColumns} loading={false} rowClickable={false} />
                )}

                {/* Add modal */}
                {modal && (
                    <GeoModal
                        title={addLabels[modal.level]}
                        fields={addFields[modal.level]}
                        onClose={() => setModal(null)}
                        onSubmit={handleAdd}
                        submitting={submitting}
                    />
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCounties;
