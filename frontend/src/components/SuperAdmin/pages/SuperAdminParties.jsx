import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const hex2rgba = (hex, a) => { const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };

const BLANK = { name:'',code:'',symbol:'',color:'#4F46E5',slogan:'',website:'',email:'',phone:'',headquarters:'',registration_date:'',is_active:true };

const PartyCard = ({ party, onEdit, onDelete }) => {
    const color = party.color || '#4F46E5';
    const safe  = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#4F46E5';
    return (
        <div className="sa-item-card" style={{ borderTop: `3px solid ${safe}`, position: 'relative', overflow: 'hidden' }}>
            {/* Color wash */}
            <div style={{ position: 'absolute', inset: 0, background: hex2rgba(safe, .06), pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
                {/* Symbol + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: safe, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                        {party.symbol || party.name?.[0] || '?'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{party.name}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{party.code}</div>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: safe }}>{Number(party.candidate_count || 0)}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.4px' }}>Candidates</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span className={party.is_active ? 'pill-active' : 'pill-closed'} style={{ fontSize: 10 }}>
                            {party.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {party.slogan && <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 10, borderLeft: `2px solid ${safe}`, paddingLeft: 8 }}>"{party.slogan}"</div>}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="sa-btn outline" style={{ flex: 1, padding: '5px', fontSize: 12 }} onClick={() => onEdit(party)}>Edit</button>
                    <button className="sa-btn ghost icon" style={{ fontSize: 12, padding: '5px 10px', color: '#DC2626' }} onClick={() => onDelete(party)}>✕</button>
                </div>
            </div>
        </div>
    );
};

const SuperAdminParties = () => {
    const [parties,  setParties]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [flash,    setFlash]    = useState({ text: '', type: '' });
    const [modal,    setModal]    = useState(false);
    const [editing,  setEditing]  = useState(null);
    const [form,     setForm]     = useState(BLANK);
    const [submitting, setSub]    = useState(false);
    const [search,   setSearch]   = useState('');

    const msg = (text, type='ok') => { setFlash({text,type}); setTimeout(()=>setFlash({text:'',type:''}),4000); };

    const load = async () => {
        try { const r = await axios.get(`${API}/super-admin/parties`,auth()); if(r.data.success) setParties(r.data.parties||[]); }
        catch { msg('Failed to load parties','err'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const openAdd  = () => { setEditing(null); setForm(BLANK); setModal(true); };
    const openEdit = (p) => { setEditing(p); setForm({...BLANK,...p}); setModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSub(true);
        try {
            if (editing) { await axios.put(`${API}/super-admin/parties/${editing.id}`, form, auth()); msg('Party updated'); }
            else         { await axios.post(`${API}/super-admin/parties`, form, auth());              msg('Party created'); }
            setModal(false); load();
        } catch (e) { msg(e.response?.data?.error||'Failed to save','err'); }
        finally { setSub(false); }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete ${p.name}?`)) return;
        try { await axios.delete(`${API}/super-admin/parties/${p.id}`, auth()); msg('Party deleted'); load(); }
        catch (e) { msg(e.response?.data?.error||'Failed to delete','err'); }
    };

    const q = search.toLowerCase();
    const filtered = parties.filter(p => !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
    const totalCandidates = parties.reduce((s, p) => s + parseInt(p.candidate_count||0), 10);

    if (loading) return <SuperAdminLayout><div className="sa-loading"><div className="sa-spin">↻</div></div></SuperAdminLayout>;

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">Political Parties</h1>
                        <p className="sa-page-sub">{parties.length} registered parties · {totalCandidates} total candidates</p>
                    </div>
                    <button className="sa-btn brand" onClick={openAdd}>+ Add Party</button>
                </div>

                {flash.text && <div className={`sa-flash ${flash.type}`}>{flash.type==='err'?'✗ ':'✓ '}{flash.text}</div>}

                <div className="sa-filter-row">
                    <div className="sa-search">
                        <span style={{ color:'#9CA3AF',fontSize:13 }}>🔍</span>
                        <input placeholder="Search parties…" value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                </div>

                {filtered.length === 0
                    ? <div className="sa-empty"><div className="sa-empty-icon">🎭</div><div className="sa-empty-title">No parties found</div></div>
                    : <div className="sa-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
                        {filtered.map(p => <PartyCard key={p.id} party={p} onEdit={openEdit} onDelete={handleDelete} />)}
                      </div>
                }

                {modal && (
                    <div className="sa-modal-overlay">
                        <div className="sa-modal" style={{ maxWidth: 580 }}>
                            <div className="sa-modal-head">
                                <h3>{editing ? 'Edit Party' : 'Add Political Party'}</h3>
                                <button className="sa-modal-close" onClick={()=>setModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="sa-modal-body">
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Party Name *</label>
                                            <input className="sa-input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Code *</label>
                                            <input className="sa-input" required placeholder="e.g. UDA" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} />
                                        </div>
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Symbol / Abbreviation</label>
                                            <input className="sa-input" placeholder="e.g. 🟢" value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Brand Color</label>
                                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                                <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{ width:36,height:36,border:'1px solid #E2E8F0',borderRadius:6,cursor:'pointer',padding:2 }} />
                                                <input className="sa-input" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="#4F46E5" style={{ flex:1 }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="sa-form-group">
                                        <label className="sa-label">Slogan</label>
                                        <input className="sa-input" value={form.slogan} onChange={e=>setForm(p=>({...p,slogan:e.target.value}))} />
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Headquarters</label>
                                            <input className="sa-input" value={form.headquarters} onChange={e=>setForm(p=>({...p,headquarters:e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Email</label>
                                            <input className="sa-input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="sa-modal-foot">
                                    <button type="button" className="sa-btn outline" onClick={()=>setModal(false)}>Cancel</button>
                                    <button type="submit" className="sa-btn brand" disabled={submitting}>{submitting?'Saving…':'Save Party'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminParties;
