import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const BLANK = { name:'', code:'', symbol:'', color:'#00763C', slogan:'', headquarters:'', email:'', website:'', phone:'', registration_date:'', is_active: true };

const PartyCard = ({ party, onEdit, onDelete }) => {
    const color = /^#[0-9A-Fa-f]{6}$/.test(party.color||'') ? party.color : '#00763C';
    const r = parseInt(color.slice(1,3),16), g2 = parseInt(color.slice(3,5),16), b = parseInt(color.slice(5,7),16);
    const tint = `rgba(${r},${g2},${b},.08)`;
    return (
        <div className="adm-item-card" style={{ borderTop: `3px solid ${color}`, background: `linear-gradient(160deg, ${tint} 0%, white 60%)` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ width:40, height:40, borderRadius:8, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:500, flexShrink:0 }}>
                    {party.symbol || (party.name||'?')[0]}
                </div>
                <div>
                    <div style={{ fontWeight:500, fontSize:14, color:'var(--t1)' }}>{party.name}</div>
                    <div style={{ fontSize:11, fontFamily:'monospace', color:'var(--t3)' }}>{party.code}</div>
                </div>
                <span className={`adm-pill ${party.is_active?'active':'closed'}`} style={{ marginLeft:'auto' }}>
                    {party.is_active?'Active':'Inactive'}
                </span>
            </div>
            {party.slogan && <div style={{ fontSize:12, color:'var(--t3)', fontStyle:'italic', marginBottom:10, borderLeft:`2px solid ${color}`, paddingLeft:8 }}>"{party.slogan}"</div>}
            <div style={{ display:'flex', gap:16, marginBottom:12 }}>
                <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:16, fontWeight:500, color }}>{Number(party.candidate_count||0)}</div>
                    <div style={{ fontSize:10, color:'var(--t4)', textTransform:'uppercase', letterSpacing:'.4px' }}>Candidates</div>
                </div>
                {party.headquarters && (
                    <div>
                        <div style={{ fontSize:11, color:'var(--t3)' }}>{party.headquarters}</div>
                        <div style={{ fontSize:10, color:'var(--t4)' }}>Headquarters</div>
                    </div>
                )}
            </div>
            <div style={{ display:'flex', gap:6 }}>
                <button className="adm-btn secondary" style={{ flex:1, justifyContent:'center', fontSize:12, padding:'6px' }} onClick={() => onEdit(party)}>
                    <Icon name="edit" size={12} /> Edit
                </button>
                <button className="adm-btn ghost icon" style={{ color:'var(--r)', padding:'6px 10px' }} onClick={() => onDelete(party)}>
                    <Icon name="trash" size={13} />
                </button>
            </div>
        </div>
    );
};

const PoliticalPartiesManagement = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [flash,   setFlash]   = useState({ text:'', type:'' });
    const [modal,   setModal]   = useState(false);
    const [editing, setEditing] = useState(null);
    const [form,    setForm]    = useState(BLANK);
    const [sub,     setSub]     = useState(false);
    const [search,  setSearch]  = useState('');

    const msg = (text, type='ok') => { setFlash({text,type}); setTimeout(()=>setFlash({text:'',type:''}),4000); };

    const load = async () => {
        try { const r = await axios.get(`${API}/admin/parties`, auth()); if(r.data.success) setParties(r.data.parties||[]); }
        catch { msg('Failed to load parties','err'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const openAdd  = () => { setEditing(null); setForm(BLANK); setModal(true); };
    const openEdit = (p) => { setEditing(p); setForm({...BLANK,...p}); setModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSub(true);
        try {
            if (editing) { await axios.put(`${API}/admin/parties/${editing.id}`, form, auth()); msg('Party updated'); }
            else         { await axios.post(`${API}/admin/parties`, form, auth()); msg('Party created'); }
            setModal(false); load();
        } catch (e) { msg(e.response?.data?.error||'Failed','err'); }
        finally { setSub(false); }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete ${p.name}?`)) return;
        try { await axios.delete(`${API}/admin/parties/${p.id}`, auth()); msg('Party deleted'); load(); }
        catch (e) { msg(e.response?.data?.error||'Failed','err'); }
    };

    const q = search.toLowerCase();
    const filtered = parties.filter(p => !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
    const total = parties.reduce((s,p) => s + parseInt(p.candidate_count||0), 0);

    if (loading) return <AdminLayout><div className="adm-loading"><div className="adm-spinner" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="adm-page">
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">Political Parties</h1>
                        <p className="adm-page-sub">{parties.length} registered parties · {total} total candidates</p>
                    </div>
                    <button className="adm-btn primary" onClick={openAdd}><Icon name="plus" size={14} /> Add party</button>
                </div>

                {flash.text && <div className={`adm-flash ${flash.type}`}><Icon name={flash.type==='err'?'alert':'check'} size={14} />{flash.text}</div>}

                <div className="adm-filter-row">
                    <div className="adm-search-box">
                        <Icon name="search" size={14} className="adm-search-icon" />
                        <input placeholder="Search parties…" value={search} onChange={e=>setSearch(e.target.value)} />
                    </div>
                </div>

                {filtered.length === 0
                    ? <div className="adm-empty"><div className="adm-empty-icon"><Icon name="party" size={32} /></div><div className="adm-empty-title">No parties found</div></div>
                    : <div className="adm-card-grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))' }}>
                        {filtered.map(p => <PartyCard key={p.id} party={p} onEdit={openEdit} onDelete={handleDelete} />)}
                      </div>
                }

                {modal && (
                    <div className="adm-modal-overlay">
                        <div className="adm-modal" style={{ maxWidth: 560 }}>
                            <div className="adm-modal-head">
                                <span className="adm-modal-title">{editing ? 'Edit party' : 'Add party'}</span>
                                <button className="adm-modal-close" onClick={()=>setModal(false)}><Icon name="x" size={16} /></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="adm-modal-body">
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">Party name *</label>
                                            <input className="adm-input" required value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Code *</label>
                                            <input className="adm-input" required placeholder="e.g. UDA" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} />
                                        </div>
                                    </div>
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">Symbol</label>
                                            <input className="adm-input" value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value}))} />
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Brand colour</label>
                                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                                <input type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{ width:34,height:34,border:'var(--hairline)',borderRadius:6,padding:2,cursor:'pointer' }} />
                                                <input className="adm-input" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{ flex:1 }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Slogan</label>
                                        <input className="adm-input" value={form.slogan} onChange={e=>setForm(p=>({...p,slogan:e.target.value}))} />
                                    </div>
                                    <div className="adm-form-row">
                                        <div className="adm-form-group">
                                            <label className="adm-label">Headquarters</label>
                                            <input className="adm-input" value={form.headquarters} onChange={e=>setForm(p=>({...p,headquarters:e.target.value}))} />
                                        </div>
                                        <div className="adm-form-group">
                                            <label className="adm-label">Email</label>
                                            <input className="adm-input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
                                        </div>
                                    </div>
                                </div>
                                <div className="adm-modal-foot">
                                    <button type="button" className="adm-btn secondary" onClick={()=>setModal(false)}>Cancel</button>
                                    <button type="submit" className="adm-btn primary" disabled={sub}>{sub?'Saving…':'Save party'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default PoliticalPartiesManagement;
