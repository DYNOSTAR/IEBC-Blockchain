import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const n    = (v) => Number(v || 0).toLocaleString();

// ── Shared modal ───────────────────────────────────────────────
const GeoModal = ({ title, fields, onClose, onSubmit, submitting, initial = {} }) => {
    const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.key, initial[f.key] ?? f.default ?? ''])));
    return (
        <div className="adm-modal-overlay">
            <div className="adm-modal">
                <div className="adm-modal-head">
                    <span className="adm-modal-title">{title}</span>
                    <button className="adm-modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
                    <div className="adm-modal-body">
                        <div className="adm-form-row">
                            {fields.map(f => (
                                <div key={f.key} className="adm-form-group" style={f.full ? { gridColumn: '1/-1' } : {}}>
                                    <label className="adm-label">{f.label}{f.required ? ' *' : ''}</label>
                                    <input className="adm-input" required={f.required} placeholder={f.placeholder}
                                        type={f.type || 'text'} value={form[f.key]}
                                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="adm-modal-foot">
                        <button type="button" className="adm-btn secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="adm-btn primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────
const CountiesManagement = () => {
    const [counties, setCounties]         = useState([]);
    const [constituencies, setConst]      = useState([]);
    const [wards, setWards]               = useState([]);
    const [drill, setDrill]               = useState(null);      // { level:'county'|'constituency', id, name }
    const [subDrill, setSubDrill]         = useState(null);
    const [loading, setLoading]           = useState(true);
    const [search, setSearch]             = useState('');
    const [modal, setModal]               = useState(null);      // { mode:'add'|'edit', level, data? }
    const [flash, setFlash]               = useState({ text: '', type: '' });
    const [sub, setSub]                   = useState(false);

    const msg = (text, type = 'ok') => { setFlash({ text, type }); setTimeout(() => setFlash({ text: '', type: '' }), 4000); };

    const loadCounties = async () => {
        setLoading(true);
        try { const r = await axios.get(`${API}/admin/counties`, auth()); if (r.data.success) setCounties(r.data.counties || []); }
        catch { msg('Failed to load counties', 'err'); }
        finally { setLoading(false); }
    };
    const loadConst = async (countyId) => {
        const r = await axios.get(`${API}/admin/constituencies`, auth());
        if (r.data.success) setConst((r.data.constituencies || []).filter(c => !countyId || c.county_id === countyId || c.county_id === parseInt(countyId)));
    };
    const loadWards = async (constId) => {
        const r = await axios.get(`${API}/admin/wards`, auth());
        if (r.data.success) setWards((r.data.wards || []).filter(w => !constId || w.constituency_id === constId || w.constituency_id === parseInt(constId)));
    };

    useEffect(() => { loadCounties(); }, []); // eslint-disable-line

    const handleCountyClick = async (county) => { setDrill({ level: 'county', id: county.id, name: county.name }); setSubDrill(null); setSearch(''); await loadConst(county.id); };
    const handleConstClick  = async (c)      => { setSubDrill({ level: 'constituency', id: c.id, name: c.name }); await loadWards(c.id); };

    const handleSave = async (form) => {
        setSub(true);
        const level = modal.level;
        try {
            if (modal.mode === 'edit') {
                if (level === 'county')       await axios.put(`${API}/admin/counties/${modal.data.id}`, form, auth());
                if (level === 'constituency') await axios.put(`${API}/admin/constituencies/${modal.data.id}`, form, auth());
                if (level === 'ward')         await axios.put(`${API}/admin/wards/${modal.data.id}`, form, auth());
                msg(`${level} updated`);
            } else {
                if (level === 'county')       await axios.post(`${API}/admin/counties`, form, auth());
                if (level === 'constituency') await axios.post(`${API}/admin/constituencies`, { ...form, county_id: drill?.id }, auth());
                if (level === 'ward')         await axios.post(`${API}/admin/wards`, { ...form, constituency_id: subDrill?.id || drill?.id }, auth());
                msg(`${level} added`);
            }
            setModal(null);
            if (level === 'county')       loadCounties();
            if (level === 'constituency') loadConst(drill?.id);
            if (level === 'ward')         loadWards(subDrill?.id);
        } catch (e) { msg(e.response?.data?.error || 'Failed', 'err'); }
        finally { setSub(false); }
    };

    const handleDelete = async (level, id, name) => {
        if (!window.confirm(`Delete ${name}?`)) return;
        try {
            if (level === 'county')       await axios.delete(`${API}/admin/counties/${id}`, auth());
            if (level === 'constituency') await axios.delete(`${API}/admin/constituencies/${id}`, auth());
            if (level === 'ward')         await axios.delete(`${API}/admin/wards/${id}`, auth());
            msg(`${level} deleted`);
            if (level === 'county')       loadCounties();
            if (level === 'constituency') loadConst(drill?.id);
            if (level === 'ward')         loadWards(subDrill?.id);
        } catch (e) { msg(e.response?.data?.error || 'Failed', 'err'); }
    };

    const currentLevel = subDrill ? 'ward' : drill ? 'constituency' : 'county';
    const q = search.toLowerCase();

    const filteredRows = useMemo(() => {
        const rows = currentLevel === 'county' ? counties : currentLevel === 'constituency' ? constituencies : wards;
        return q ? rows.filter(r => r.name?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q)) : rows;
    }, [counties, constituencies, wards, currentLevel, q]);

    const FIELDS = {
        county:        [{ key: 'name', label: 'County name', required: true, full: true }, { key: 'code', label: 'Code', required: true }, { key: 'headquarters', label: 'Headquarters' }, { key: 'population', label: 'Population', type: 'number' }],
        constituency:  [{ key: 'name', label: 'Constituency name', required: true, full: true }, { key: 'code', label: 'Code' }],
        ward:          [{ key: 'name', label: 'Ward name', required: true, full: true }, { key: 'code', label: 'Code' }],
    };

    const TITLES = {
        county: 'Counties', constituency: `${drill?.name || ''} — Constituencies`, ward: `${subDrill?.name || ''} — Wards`
    };
    const SUBS = {
        county: `${counties.length} counties · click a row to see constituencies`,
        constituency: 'Click a constituency to see its wards',
        ward: 'Ward-level data'
    };
    const ADD_LABELS = { county: 'Add county', constituency: 'Add constituency', ward: 'Add ward' };

    const breadcrumbs = [
        { label: 'Counties', onClick: () => { setDrill(null); setSubDrill(null); setSearch(''); } },
        drill    && { label: drill.name,    onClick: () => { setSubDrill(null); setSearch(''); loadConst(drill.id); } },
        subDrill && { label: subDrill.name, onClick: null },
    ].filter(Boolean);

    const COLUMNS = {
        county:       [{ k: 'code', l: 'Code' }, { k: 'name', l: 'County' }, { k: 'headquarters', l: 'HQ' }, { k: 'population', l: 'Population', f: n }, { k: 'registered_voters', l: 'Registered', f: n }, { k: 'constituency_count', l: 'Const.', f: n }],
        constituency: [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Constituency' }, { k: 'ward_count', l: 'Wards', f: n }],
        ward:         [{ k: 'code', l: 'Code' }, { k: 'name', l: 'Ward' }],
    };

    return (
        <AdminLayout>
            <div className="adm-page">
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">{TITLES[currentLevel]}</h1>
                        <p className="adm-page-sub">{SUBS[currentLevel]}</p>
                    </div>
                    <button className="adm-btn primary" onClick={() => setModal({ mode: 'add', level: currentLevel })}>
                        <Icon name="plus" size={14} /> {ADD_LABELS[currentLevel]}
                    </button>
                </div>

                {flash.text && (
                    <div className={`adm-flash ${flash.type}`}>
                        <Icon name={flash.type === 'err' ? 'alert' : 'check'} size={14} />
                        {flash.text}
                    </div>
                )}

                {/* Breadcrumb */}
                {breadcrumbs.length > 1 && (
                    <div className="adm-breadcrumb">
                        {breadcrumbs.map((c, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span className="adm-crumb-sep"><Icon name="chevron" size={11} /></span>}
                                <span className={`adm-crumb ${i === breadcrumbs.length - 1 ? 'active' : ''}`} onClick={c.onClick || undefined}>{c.label}</span>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Search (county level only) */}
                {currentLevel === 'county' && (
                    <div className="adm-filter-row">
                        <div className="adm-search-box">
                            <Icon name="search" size={14} className="adm-search-icon" />
                            <input placeholder="Search counties…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="adm-loading"><div className="adm-spinner" /></div>
                ) : (
                    <div className="adm-card">
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        {COLUMNS[currentLevel].map(c => <th key={c.k}>{c.l}</th>)}
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.length === 0 && (
                                        <tr><td colSpan={COLUMNS[currentLevel].length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--t4)' }}>No records found</td></tr>
                                    )}
                                    {filteredRows.map(row => (
                                        <tr key={row.id}
                                            style={{ cursor: currentLevel !== 'ward' ? 'pointer' : 'default' }}
                                            onClick={currentLevel === 'county' ? () => handleCountyClick(row) : currentLevel === 'constituency' ? () => handleConstClick(row) : undefined}>
                                            {COLUMNS[currentLevel].map(c => (
                                                <td key={c.k} style={c.k === 'code' ? { fontFamily: 'monospace', fontSize: 11, color: 'var(--t3)' } : {}}>
                                                    {c.f ? c.f(row[c.k]) : (row[c.k] ?? '—')}
                                                </td>
                                            ))}
                                            <td>
                                                <div className="row-actions">
                                                    <button className="adm-btn ghost icon"
                                                        onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', level: currentLevel, data: row }); }}>
                                                        <Icon name="edit" size={13} />
                                                    </button>
                                                    <button className="adm-btn ghost icon"
                                                        style={{ color: 'var(--r)' }}
                                                        onClick={e => { e.stopPropagation(); handleDelete(currentLevel, row.id, row.name); }}>
                                                        <Icon name="trash" size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal */}
                {modal && (
                    <GeoModal
                        title={`${modal.mode === 'edit' ? 'Edit' : 'Add'} ${modal.level}`}
                        fields={FIELDS[modal.level]}
                        onClose={() => setModal(null)}
                        onSubmit={handleSave}
                        submitting={sub}
                        initial={modal.data || {}}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default CountiesManagement;
