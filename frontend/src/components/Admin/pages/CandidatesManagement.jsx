import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const LEVEL_COLOR = { national: '#1D4ED8', county: '#BB0000', constituency: '#00763C', ward: '#7C3AED' };

const CandidateCard = ({ c, onDelete }) => {
    const initial = (c.name || '?')[0].toUpperCase();
    const color   = c.party_color || LEVEL_COLOR[c.position_level] || '#9CA3AF';
    const loc     = c.ward_name || c.constituency_name || c.county_name || 'National';
    return (
        <div className="adm-item-card" style={{ borderTop: `3px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{c.position_name || '—'}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${color}18`, color, fontWeight: 500 }}>{c.party || c.symbol || '—'}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#F3F4F6', color: 'var(--t3)' }}>{loc}</span>
            </div>
            <button className="adm-btn danger" style={{ width: '100%', justifyContent: 'center', fontSize: 12, padding: '5px' }} onClick={() => onDelete(c)}>
                <Icon name="trash" size={12} /> Remove
            </button>
        </div>
    );
};

const CandidatesManagement = () => {
    const [candidates, setCandidates] = useState([]);
    const [positions,  setPositions]  = useState([]);
    const [parties,    setParties]    = useState([]);
    const [elections,  setElections]  = useState([]);
    const [counties,   setCounties]   = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [view,       setView]       = useState('table');
    const [search,     setSearch]     = useState('');
    const [posFilter,  setPosFilter]  = useState('');
    const [partyFilter,setPartyFilter]= useState('');
    const [flash,      setFlash]      = useState({ text: '', type: '' });
    const [modal,      setModal]      = useState(false);
    const [sub,        setSub]        = useState(false);
    const [form,       setForm]       = useState({ election_id:'', position_id:'', political_party_id:'', name:'', symbol:'', description:'', county_id:'', constituency_id:'', ward_id:'' });

    const msg = (text, type='ok') => { setFlash({text,type}); setTimeout(()=>setFlash({text:'',type:''}),4000); };

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/admin/candidates`, auth()),
            axios.get(`${API}/admin/positions`, auth()),
            axios.get(`${API}/admin/parties`, auth()),
            axios.get(`${API}/elections`, auth()),
            axios.get(`${API}/counties`, auth()),
        ]).then(([c,p,pt,e,co]) => {
            setCandidates(c.data.candidates || []);
            setPositions(p.data.positions   || []);
            setParties(pt.data.parties      || []);
            setElections(e.data.elections   || []);
            setCounties(co.data.counties    || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (c) => {
        if (!window.confirm(`Remove ${c.name}?`)) return;
        try { await axios.delete(`${API}/admin/candidates/${c.id}`, auth()); msg('Candidate removed'); setCandidates(cs => cs.filter(x => x.id !== c.id)); }
        catch (e) { msg(e.response?.data?.error || 'Failed', 'err'); }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setSub(true);
        try {
            const r = await axios.post(`${API}/admin/candidates`, form, auth());
            if (r.data.success) { msg('Candidate added'); setCandidates(cs => [r.data.candidate, ...cs]); setModal(false); }
            else msg(r.data.error || 'Failed', 'err');
        } catch (e) { msg(e.response?.data?.error || 'Failed', 'err'); }
        finally { setSub(false); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return candidates.filter(c => {
            if (q && !`${c.name||''} ${c.party||''}`.toLowerCase().includes(q)) return false;
            if (posFilter && String(c.position_id) !== posFilter) return false;
            if (partyFilter && String(c.political_party_id) !== partyFilter) return false;
            return true;
        });
    }, [candidates, search, posFilter, partyFilter]);

    const loc = (c) => c.ward_name || c.constituency_name || c.county_name || 'National';

    if (loading) return <AdminLayout><div className="adm-loading"><div className="adm-spinner" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="adm-page">
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">Candidates</h1>
                        <p className="adm-page-sub">{candidates.length} candidates across {positions.length} positions</p>
                    </div>
                    <button className="adm-btn primary" onClick={() => setModal(true)}>
                        <Icon name="plus" size={14} /> Add candidate
                    </button>
                </div>

                {flash.text && <div className={`adm-flash ${flash.type}`}><Icon name={flash.type==='err'?'alert':'check'} size={14} />{flash.text}</div>}

                <div className="adm-filter-row">
                    <div className="adm-search-box" style={{ maxWidth: 300 }}>
                        <Icon name="search" size={14} className="adm-search-icon" />
                        <input placeholder="Search by name or party…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="adm-select" style={{ width: 200, height: 36 }} value={posFilter} onChange={e => setPosFilter(e.target.value)}>
                        <option value="">All positions</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="adm-select" style={{ width: 160, height: 36 }} value={partyFilter} onChange={e => setPartyFilter(e.target.value)}>
                        <option value="">All parties</option>
                        {parties.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
                    </select>
                    {(search||posFilter||partyFilter) && <button className="adm-btn ghost" onClick={()=>{setSearch('');setPosFilter('');setPartyFilter('');}}>Clear</button>}
                    <div className="adm-view-toggle" style={{ marginLeft: 'auto' }}>
                        <button className={`adm-view-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')}><Icon name="results" size={13} /></button>
                        <button className={`adm-view-btn ${view==='grid'?'active':''}`} onClick={()=>setView('grid')}><Icon name="dashboard" size={13} /></button>
                    </div>
                </div>

                {view === 'grid'
                    ? <div className="adm-card-grid">{filtered.map(c => <CandidateCard key={c.id} c={c} onDelete={handleDelete} />)}</div>
                    : (
                        <div className="adm-card">
                            <div className="adm-table-wrap">
                                <table className="adm-table">
                                    <thead><tr><th>Candidate</th><th>Party</th><th>Position</th><th>Level</th><th>Location</th><th>Status</th><th></th></tr></thead>
                                    <tbody>
                                        {filtered.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:32,color:'var(--t4)'}}>No candidates found</td></tr>}
                                        {filtered.map(c => (
                                            <tr key={c.id}>
                                                <td>
                                                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                                                        <div className="adm-avatar" style={{ background: c.party_color || LEVEL_COLOR[c.position_level] || 'var(--g)' }}>{(c.name||'?')[0]}</div>
                                                        <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 12 }}>{c.party || c.symbol || '—'}</td>
                                                <td style={{ fontSize: 12 }}>{c.position_name || '—'}</td>
                                                <td>
                                                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${LEVEL_COLOR[c.position_level]||'#9CA3AF'}18`, color: LEVEL_COLOR[c.position_level]||'#9CA3AF', fontWeight: 500 }}>
                                                        {c.position_level || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--t3)' }}>{loc(c)}</td>
                                                <td><span className={`adm-pill ${c.is_active!==false?'active':'closed'}`}>{c.is_active!==false?'Active':'Inactive'}</span></td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button className="adm-btn ghost icon" style={{ color:'var(--r)' }} onClick={() => handleDelete(c)}><Icon name="trash" size={13} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {modal && (
                    <div className="adm-modal-overlay">
                        <div className="adm-modal" style={{ maxWidth: 600 }}>
                            <div className="adm-modal-head">
                                <span className="adm-modal-title">Add candidate</span>
                                <button className="adm-modal-close" onClick={() => setModal(false)}><Icon name="x" size={16} /></button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="adm-modal-body">
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">Election *</label>
                                            <select className="adm-select" required value={form.election_id} onChange={e=>setForm(p=>({...p,election_id:e.target.value}))}>
                                                <option value="">Select election</option>
                                                {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Position *</label>
                                            <select className="adm-select" required value={form.position_id} onChange={e=>setForm(p=>({...p,position_id:e.target.value}))}>
                                                <option value="">Select position</option>
                                                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">Full name *</label>
                                            <input className="adm-input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Party</label>
                                            <select className="adm-select" value={form.political_party_id} onChange={e=>setForm(p=>({...p,political_party_id:e.target.value}))}>
                                                <option value="">Independent</option>
                                                {parties.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">County</label>
                                            <select className="adm-select" value={form.county_id} onChange={e=>setForm(p=>({...p,county_id:e.target.value}))}>
                                                <option value="">National</option>
                                                {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Party abbreviation</label>
                                            <input className="adm-input" placeholder="e.g. UDA" value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value}))} />
                                        </div>
                                    </div>
                                    <div className="adm-form-group" style={{ gridColumn: '1/-1' }}>
                                        <label className="adm-label">Description</label>
                                        <input className="adm-input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
                                    </div>
                                </div>
                                <div className="adm-modal-foot">
                                    <button type="button" className="adm-btn secondary" onClick={() => setModal(false)}>Cancel</button>
                                    <button type="submit" className="adm-btn primary" disabled={sub}>{sub ? 'Saving…' : 'Add candidate'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CandidatesManagement;
