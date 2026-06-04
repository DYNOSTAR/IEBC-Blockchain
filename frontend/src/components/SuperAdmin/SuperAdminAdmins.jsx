import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';

const API  = 'http://localhost:5000/api';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const avatarColor = (name = '') => {
    const colors = ['#4F46E5','#7C3AED','#2563EB','#D97706','#16A34A','#DC2626'];
    return colors[name.charCodeAt(0) % colors.length];
};

const Avatar = ({ name }) => {
    const parts = name ? name.split(' ') : ['?'];
    const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    return (
        <div className="sa-avatar" style={{ background: avatarColor(name) }}>
            {initials.toUpperCase() || '?'}
        </div>
    );
};

const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', iebc_official: 'Official' };

const SuperAdminAdmins = () => {
    const [admins,  setAdmins]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [flash,   setFlash]   = useState({ text: '', type: '' });
    const [search,  setSearch]  = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showModal, setModal] = useState(false);
    const [showPw,  setShowPw]  = useState(false);
    const [submitting, setSub]  = useState(false);
    const [form, setForm] = useState({
        national_id: '', first_name: '', last_name: '', email: '',
        phone: '', role: 'admin', password: '', department: '', position: ''
    });

    const msg = (text, type = 'ok') => {
        setFlash({ text, type });
        setTimeout(() => setFlash({ text: '', type: '' }), 4000);
    };

    const load = async () => {
        try {
            const r = await axios.get(`${API}/super-admin/admins`, auth());
            if (r.data.success) setAdmins(r.data.admins || []);
        } catch { msg('Failed to load admins', 'err'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const handleCreate = async (e) => {
        e.preventDefault();
        setSub(true);
        try {
            const r = await axios.post(`${API}/super-admin/admins`, form, auth());
            if (r.data.success) { msg('Admin created successfully'); setModal(false); setForm({ national_id:'',first_name:'',last_name:'',email:'',phone:'',role:'admin',password:'',department:'',position:'' }); load(); }
            else msg(r.data.error || 'Failed to create admin', 'err');
        } catch (e) { msg(e.response?.data?.error || 'Failed to create admin', 'err'); }
        finally { setSub(false); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove ${name} as administrator?`)) return;
        try {
            await axios.delete(`${API}/super-admin/admins/${id}`, auth());
            msg('Admin removed'); load();
        } catch { msg('Failed to remove admin', 'err'); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return admins.filter(a => {
            const matchSearch = !q || `${a.first_name} ${a.last_name} ${a.email} ${a.national_id}`.toLowerCase().includes(q);
            const matchRole   = !roleFilter || a.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [admins, search, roleFilter]);

    if (loading) return <SuperAdminLayout><div className="sa-loading"><div className="sa-spin">↻</div></div></SuperAdminLayout>;

    return (
        <SuperAdminLayout>
            <div className="sa-page">
                <div className="sa-page-header">
                    <div>
                        <h1 className="sa-page-title">Manage Admins</h1>
                        <p className="sa-page-sub">{admins.length} system administrator{admins.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button className="sa-btn brand" onClick={() => setModal(true)}>+ Add Admin</button>
                </div>

                {flash.text && <div className={`sa-flash ${flash.type}`}>{flash.type === 'err' ? '✗ ' : '✓ '}{flash.text}</div>}

                {/* Filters */}
                <div className="sa-filter-row">
                    <div className="sa-search" style={{ flex: 1, maxWidth: 360 }}>
                        <span style={{ color: '#9CA3AF', fontSize: 13 }}>🔍</span>
                        <input placeholder="Search by name, email or national ID…" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="sa-select" style={{ width: 160, height: 36 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">All roles</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="iebc_official">IEBC Official</option>
                    </select>
                </div>

                {/* Table */}
                <div className="sa-card">
                    <div className="sa-table-wrap">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Administrator</th>
                                    <th>National ID</th>
                                    <th>Role</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Created</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No administrators found</td></tr>
                                )}
                                {filtered.map(a => (
                                    <tr key={a.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <Avatar name={`${a.first_name} ${a.last_name}`} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{a.first_name} {a.last_name}</div>
                                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{a.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="sa-monospace">{a.national_id || '—'}</span></td>
                                        <td>
                                            <span className={`sa-badge ${a.role === 'super_admin' ? 'brand' : 'blue'}`}>
                                                {ROLE_LABELS[a.role] || a.role}
                                            </span>
                                        </td>
                                        <td style={{ color: '#6B7280' }}>{a.department || '—'}</td>
                                        <td>
                                            <span className={a.is_active ? 'pill-active' : 'pill-closed'}>
                                                {a.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>
                                            {a.last_login ? new Date(a.last_login).toLocaleDateString('en-KE') : 'Never'}
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>{new Date(a.created_at).toLocaleDateString('en-KE')}</td>
                                        <td>
                                            <div className="row-actions" style={{ display: 'flex', gap: 6 }}>
                                                <button className="sa-btn ghost icon" title="Remove"
                                                    onClick={() => handleDelete(a.id, `${a.first_name} ${a.last_name}`)}>✕</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create modal */}
                {showModal && (
                    <div className="sa-modal-overlay">
                        <div className="sa-modal">
                            <div className="sa-modal-head">
                                <h3>Add New Administrator</h3>
                                <button className="sa-modal-close" onClick={() => setModal(false)}>✕</button>
                            </div>
                            <form onSubmit={handleCreate}>
                                <div className="sa-modal-body">
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">First Name *</label>
                                            <input className="sa-input" required placeholder="First name"
                                                value={form.first_name} onChange={e => setForm(p => ({...p, first_name: e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Last Name *</label>
                                            <input className="sa-input" required placeholder="Last name"
                                                value={form.last_name} onChange={e => setForm(p => ({...p, last_name: e.target.value}))} />
                                        </div>
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">National ID *</label>
                                            <input className="sa-input" required placeholder="e.g. 12345678"
                                                value={form.national_id} onChange={e => setForm(p => ({...p, national_id: e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Role *</label>
                                            <select className="sa-select" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                                <option value="iebc_official">IEBC Official</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sa-form-group">
                                        <label className="sa-label">Email *</label>
                                        <input className="sa-input" type="email" required placeholder="admin@iebc.or.ke"
                                            value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
                                    </div>
                                    <div className="sa-form-row">
                                        <div className="sa-form-group">
                                            <label className="sa-label">Phone</label>
                                            <input className="sa-input" placeholder="07XXXXXXXX"
                                                value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                                        </div>
                                        <div className="sa-form-group">
                                            <label className="sa-label">Department</label>
                                            <input className="sa-input" placeholder="e.g. Election"
                                                value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} />
                                        </div>
                                    </div>
                                    <div className="sa-form-group">
                                        <label className="sa-label">Password *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="sa-input" required type={showPw ? 'text' : 'password'} placeholder="Minimum 8 characters"
                                                value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                                                style={{ paddingRight: 40 }} />
                                            <button type="button" onClick={() => setShowPw(s => !s)}
                                                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 13 }}>
                                                {showPw ? '◉' : '○'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="sa-modal-foot">
                                    <button type="button" className="sa-btn outline" onClick={() => setModal(false)}>Cancel</button>
                                    <button type="submit" className="sa-btn brand" disabled={submitting}>{submitting ? 'Creating…' : 'Create Admin'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminAdmins;
