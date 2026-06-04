import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import Icon from '../../shared/Icon';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const AdminProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form,    setForm]    = useState({});
    const [flash,   setFlash]   = useState({ text:'', type:'' });
    const [sub,     setSub]     = useState(false);

    const msg = (text, type='ok') => { setFlash({text,type}); setTimeout(()=>setFlash({text:'',type:''}),4000); };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const uid  = user?.id;
        if (uid) {
            axios.get(`${API}/voter/details/${uid}`, auth()).then(r => {
                if (r.data.success) setProfile(r.data.voter || r.data);
            }).catch(() => setProfile(user));
        } else setProfile(user);
        setLoading(false);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault(); setSub(true);
        try {
            await axios.put(`${API}/voter/update-profile`, form, auth());
            msg('Profile updated');
            setProfile(p => ({ ...p, ...form }));
            setEditing(false);
        } catch (e) { msg(e.response?.data?.error || 'Failed to update', 'err'); }
        finally { setSub(false); }
    };

    const name = profile ? `${profile.firstName||profile.first_name||''} ${profile.lastName||profile.last_name||''}`.trim() : '';
    const initials = name.split(' ').map(p=>p[0]||'').slice(0,2).join('').toUpperCase() || 'A';

    if (loading) return <AdminLayout><div className="adm-loading"><div className="adm-spinner" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="adm-page" style={{ maxWidth: 640 }}>
                <div className="adm-page-header">
                    <div>
                        <h1 className="adm-page-title">My Profile</h1>
                        <p className="adm-page-sub">Account details and settings</p>
                    </div>
                    {!editing && (
                        <button className="adm-btn secondary" onClick={() => { setForm({ email: profile?.email||'', phone: profile?.phone||'' }); setEditing(true); }}>
                            <Icon name="edit" size={14} /> Edit
                        </button>
                    )}
                </div>

                {flash.text && <div className={`adm-flash ${flash.type}`}><Icon name={flash.type==='err'?'alert':'check'} size={14} />{flash.text}</div>}

                {/* Avatar card */}
                <div className="adm-card" style={{ marginBottom: 16 }}>
                    <div className="adm-card-body" style={{ display:'flex', alignItems:'center', gap:20 }}>
                        <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--g)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:500, flexShrink:0 }}>
                            {initials}
                        </div>
                        <div>
                            <div style={{ fontSize:20, fontWeight:500, color:'var(--t1)', marginBottom:4 }}>{name || 'Administrator'}</div>
                            <span className={`adm-role ${profile?.role==='super_admin'?'super':'admin'}`}>
                                {profile?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="adm-card">
                    <div className="adm-card-head"><div className="adm-card-title">Account information</div></div>
                    {!editing ? (
                        <div className="adm-card-body">
                            {[
                                { l: 'Full name',    v: name || '—' },
                                { l: 'Email',        v: profile?.email || '—' },
                                { l: 'Phone',        v: profile?.phone || '—' },
                                { l: 'National ID',  v: profile?.nationalId || profile?.national_id || '—', mono: true },
                                { l: 'Role',         v: profile?.role || '—' },
                                { l: 'County',       v: profile?.countyName || '—' },
                                { l: 'Last login',   v: profile?.last_login ? new Date(profile.last_login).toLocaleString('en-KE') : '—' },
                            ].map(r => (
                                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'var(--hairline)', fontSize:13, ':last-child':{ borderBottom:'none' } }}>
                                    <span style={{ color:'var(--t3)' }}>{r.l}</span>
                                    <span style={{ fontFamily:r.mono?'monospace':'inherit', color:'var(--t1)' }}>{r.v}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSave}>
                            <div className="adm-card-body">
                                <div className="adm-form-group">
                                    <label className="adm-label">Email</label>
                                    <input className="adm-input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">Phone</label>
                                    <input className="adm-input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
                                </div>
                                <div className="adm-form-group">
                                    <label className="adm-label">New password (leave blank to keep current)</label>
                                    <input className="adm-input" type="password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="adm-modal-foot" style={{ padding:'14px 18px' }}>
                                <button type="button" className="adm-btn secondary" onClick={() => setEditing(false)}>Cancel</button>
                                <button type="submit" className="adm-btn primary" disabled={sub}>{sub?'Saving…':'Save changes'}</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminProfile;
