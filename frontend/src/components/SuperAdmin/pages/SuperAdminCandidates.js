import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const LEVEL_COLORS = { national:'#4F46E5', county:'#DC2626', constituency:'#2563EB', ward:'#7C3AED' };

const CandCard = ({ c }) => (
    <div className="sa-item-card">
        {/* Avatar circle */}
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: c.party_color || '#4F46E5', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 16, fontWeight: 700, color:'#fff', margin: '0 auto 10px' }}>
            {(c.name||'?')[0].toUpperCase()}
        </div>
        <div style={{ textAlign:'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color:'#111827', marginBottom: 3 }}>{c.name}</div>
            <div style={{ display:'flex', justifyContent:'center', gap: 6, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, padding:'2px 7px', borderRadius:10, background: c.party_color||'#E0E7FF', color:'#fff', fontWeight:600, background: c.party_color||'#4F46E5' }}>{c.symbol || c.party || '—'}</span>
                <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background: `${LEVEL_COLORS[c.position_level]||'#4F46E5'}18`, color: LEVEL_COLORS[c.position_level]||'#4F46E5', fontWeight:500 }}>{c.position_name||'—'}</span>
            </div>
        </div>
        <div style={{ fontSize:11, color:'#9CA3AF', textAlign:'center' }}>
            {c.county_name || c.constituency_name || c.ward_name || 'National'}
        </div>
    </div>
);

const SuperAdminCandidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [positions,  setPositions]  = useState([]);
    const [parties,    setParties]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [view,       setView]       = useState('table'); // 'table' | 'grid'
    const [search,     setSearch]     = useState('');
    const [posFilter,  setPosFilter]  = useState('');
    const [partyFilter,setPartyFilter]= useState('');
    const [flash,      setFlash]      = useState({ text:'', type:'' });
    const [modal,      setModal]      = useState(false);
    const [submitting, setSub]        = useState(false);
    const [form,       setForm]       = useState({ election_id:'', position_id:'', political_party_id:'', name:'', symbol:'', description:'', county_id:'', constituency_id:'', ward_id:'', is_independent: false });
    const [elections,  setElections]  = useState([]);
    const [counties,   setCounties]   = useState([]);

    const msg = (text, type='ok') => { setFlash({text,type}); setTimeout(()=>setFlash({text:'',type:''}),4000); };

    useEffect(() => {
        Promise.all([
            axios.get(`${API}/super-admin/candidates`,  auth()),
            axios.get(`${API}/super-admin/positions`,   auth()),
            axios.get(`${API}/super-admin/parties`,     auth()),
            axios.get(`${API}/super-admin/elections`,   auth()),
            axios.get(`${API}/super-admin/counties`,    auth()),
        ]).then(([c, p, pt, e, co]) => {
            setCandidates(c.data.candidates || []);
            setPositions(p.data.positions   || []);
            setParties(pt.data.parties      || []);
            setElections(e.data.elections   || []);
            setCounties(co.data.counties    || []);
        }).finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove ${name}?`)) return;
        try { await axios.delete(`${API}/super-admin/candidates/${id}`, auth()); msg('Candidate removed'); setCandidates(cs => cs.filter(c => c.id !== id)); }
        catch { msg('Failed to remove','err'); }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); setSub(true);
        try {
            const r = await axios.post(`${API}/super-admin/candidates`, form, auth());
            if (r.data.success) { msg('Candidate added'); setModal(false); setCandidates(cs => [r.data.candidate, ...cs]); }
            else msg(r.data.error || 'Failed', 'err');
        } catch (e) { msg(e.response?.data?.error||'Failed','err'); }
        finally { setSub(false); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return candidates.filter(c => {
            if (q && !`${c.name||''} ${c.symbol||''}`.toLowerCase().includes(q)) return false;
            if (posFilter   && String(c.position_id) !== posFilter) return false;
            if (partyFilter && String(c.political_party_id) !== partyFilter) return false;
            return true;
        });
    }, [candidates, search, posFilter, partyFilter]);

    const getLocation = (c) => c.ward_name || c.constituency_name || c.county_name || 'National';

    if (loading) return <SuperAdminLayout><div className="sa-loading"><div className="sa-spin">↻</div></div></SuperAdminLayout>;

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">All Candidates</h1>
                        <p className="sa-page-sub">{candidates.length} candidates across {positions.length} positions</p>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                        <div className="sa-view-toggle">
                            <button className={`sa-view-btn ${view==='table'?'active':''}`} onClick={()=>setView('table')}>≡ Table</button>
                            <button className={`sa-view-btn ${view==='grid' ?'active':''}`} onClick={()=>setView('grid')}>⊞ Grid</button>
                        </div>
                        <button className="sa-btn brand" onClick={()=>setModal(true)}>+ Add Candidate</button>
                    </div>
                </div>

                {flash.text && <div className={`sa-flash ${flash.type}`}>{flash.type==='err'?'✗ ':'✓ '}{flash.text}</div>}

                <div className="sa-filter-row">
                    <div className="sa-search" style={{ flex:1, maxWidth:340 }}>
                        <span style={{ color:'#9CA3AF', fontSize:13 }}>🔍</span>
                        <input placeholder="Search by name or party…" value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                    <select className="sa-select" style={{ width:200,height:36 }} value={posFilter} onChange={e=>setPosFilter(e.target.value)}>
                        <option value="">All Positions</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="sa-select" style={{ width:160,height:36 }} value={partyFilter} onChange={e=>setPartyFilter(e.target.value)}>
                        <option value="">All Parties</option>
                        {parties.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                    </select>
                    {(search || posFilter || partyFilter) && <button className="sa-btn ghost" onClick={()=>{setSearch('');setPosFilter('');setPartyFilter('');}}>Clear</button>}
                </div>

                {view === 'grid'
                    ? <div className="sa-card-grid">{filtered.map(c => <CandCard key={c.id} c={c} />)}</div>
                    : (
                        <div className="sa-card">
                            <div className="sa-table-wrap">
                                <table className="sa-table">
                                    <thead><tr><th>Name</th><th>Party</th><th>Position</th><th>Location</th><th>Level</th><th>Status</th><th></th></tr></thead>
                                    <tbody>
                                        {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'#9CA3AF' }}>No candidates found</td></tr>}
                                        {filtered.map(c => (
                                            <tr key={c.id}>
                                                <td>
                                                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                                                        <div style={{ width:28,height:28,borderRadius:'50%',background:c.party_color||'#4F46E5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',flexShrink:0 }}>{(c.name||'?')[0]}</div>
                                                        <span style={{ fontWeight:600, fontSize:13 }}>{c.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize:11,padding:'2px 8px',borderRadius:10,background:c.party_color||'#4F46E5',color:'#fff',fontWeight:600 }}>{c.symbol||c.party_name||'—'}</span>
                                                </td>
                                                <td style={{ fontSize:12 }}>{c.position_name||'—'}</td>
                                                <td style={{ fontSize:12, color:'#6B7280' }}>{getLocation(c)}</td>
                                                <td>
                                                    <span style={{ fontSize:10,padding:'2px 7px',borderRadius:10,background:`${LEVEL_COLORS[c.position_level]||'#4F46E5'}18`,color:LEVEL_COLORS[c.position_level]||'#4F46E5',fontWeight:500 }}>
                                                        {c.position_level||'—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {c.is_active ? <span className="pill-active">Active</span> : <span className="pill-closed">Inactive</span>}
                                                </td>
                                                <td>
                                                    <div className="row-actions">
                                                        <button className="sa-btn ghost icon" style={{ color:'#DC2626',fontSize:12 }} onClick={()=>handleDelete(c.id,c.name)}>✕</button>
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
                    <div className="sa-modal-overlay">
                        <div className="sa-modal" style={{ maxWidth: 620 }}>
                            <div className="sa-modal-head"><h3>Add Candidate</h3><button className="sa-modal-close" onClick={()=>setModal(false)}>✕</button></div>
                            <form onSubmit={handleCreate}>
                                <div className="sa-modal-body">
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Election *</label>
                                            <select className="sa-select" required value={form.election_id} onChange={e=>setForm(p=>({...p,election_id:e.target.value}))}>
                                                <option value="">Select election</option>
                                                {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Position *</label>
                                            <select className="sa-select" required value={form.position_id} onChange={e=>setForm(p=>({...p,position_id:e.target.value}))}>
                                                <option value="">Select position</option>
                                                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Full Name *</label>
                                            <input className="sa-input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Party</label>
                                            <select className="sa-select" value={form.political_party_id} onChange={e=>setForm(p=>({...p,political_party_id:e.target.value}))}>
                                                <option value="">Select party</option>
                                                {parties.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">County</label>
                                            <select className="sa-select" value={form.county_id} onChange={e=>setForm(p=>({...p,county_id:e.target.value}))}>
                                                <option value="">Select county</option>
                                                {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Symbol / Party Abbr.</label>
                                            <input className="sa-input" placeholder="e.g. UDA" value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value}))} />
                                        </div>
                                    </div>
                                    <div className="sa-form-group">
                                        <label className="sa-label">Description</label>
                                        <input className="sa-input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
                                    </div>
                                </div>
                                <div className="sa-modal-foot">
                                    <button type="button" className="sa-btn outline" onClick={()=>setModal(false)}>Cancel</button>
                                    <button type="submit" className="sa-btn brand" disabled={submitting}>{submitting?'Saving…':'Add Candidate'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCandidates;
