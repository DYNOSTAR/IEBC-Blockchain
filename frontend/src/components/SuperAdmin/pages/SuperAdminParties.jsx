import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-parties.css';

const SuperAdminParties = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingParty, setEditingParty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        symbol: '',
        color: '#00A651',
        slogan: '',
        website: '',
        email: '',
        phone: '',
        headquarters: '',
        registration_date: '',
        is_active: true
    });

    useEffect(() => {
        loadParties();
    }, []);

    const loadParties = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/parties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setParties(response.data.parties);
                setError('');
            }
        } catch (error) {
            console.error('Error loading parties:', error);
            setError('Failed to load political parties');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.code) {
            alert('Party name and code are required');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = editingParty 
                ? `http://localhost:5000/api/super-admin/parties/${editingParty.id}`
                : 'http://localhost:5000/api/super-admin/parties';
            const method = editingParty ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingParty ? 'Party updated successfully!' : 'Party added successfully!');
                loadParties();
                setShowModal(false);
                setEditingParty(null);
                setFormData({
                    name: '',
                    code: '',
                    symbol: '',
                    color: '#00A651',
                    slogan: '',
                    website: '',
                    email: '',
                    phone: '',
                    headquarters: '',
                    registration_date: '',
                    is_active: true
                });
            }
        } catch (error) {
            console.error('Error saving party:', error);
            alert(error.response?.data?.error || 'Failed to save party');
        }
    };

    const handleEdit = (party) => {
        setEditingParty(party);
        setFormData({
            name: party.name,
            code: party.code,
            symbol: party.symbol || '',
            color: party.color || '#00A651',
            slogan: party.slogan || '',
            website: party.website || '',
            email: party.email || '',
            phone: party.phone || '',
            headquarters: party.headquarters || '',
            registration_date: party.registration_date ? party.registration_date.split('T')[0] : '',
            is_active: party.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`⚠️ WARNING: Deleting this party will remove it from all candidates!\nAre you sure?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/parties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Party deleted successfully!');
                loadParties();
            } catch (error) {
                console.error('Error deleting party:', error);
                alert(error.response?.data?.error || 'Failed to delete party');
            }
        }
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading political parties...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-parties-page">
                <div className="page-header">
                    <div>
                        <h1>🎭 Political Parties Management</h1>
                        <p>Manage all registered political parties in Kenya (Super Admin - Country Level Control)</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Party
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-number">{parties.length}</span>
                        <span className="stat-label">Total Parties</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{parties.filter(p => p.is_active).length}</span>
                        <span className="stat-label">Active Parties</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{parties.reduce((a, b) => a + (b.candidate_count || 0), 0)}</span>
                        <span className="stat-label">Total Candidates</span>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Code</th>
                                <th>Party Name</th>
                                <th>Color</th>
                                <th>Slogan</th>
                                <th>Candidates</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parties.map((party) => (
                                <tr key={party.id}>
                                    <td className="symbol-cell">{party.symbol || '🎭'}</td>
                                    <td><span className="party-code">{party.code}</span></td>
                                    <td><strong>{party.name}</strong></td>
                                    <td>
                                        <div 
                                            className="color-preview" 
                                            style={{ backgroundColor: party.color }}
                                            title={party.color}
                                        ></div>
                                    </td>
                                    <td className="slogan-cell">{party.slogan || '-'}</td>
                                    <td>{party.candidate_count || 0}</td>
                                    <td>
                                        <span className={`status-badge ${party.is_active ? 'active' : 'inactive'}`}>
                                            {party.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(party)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(party.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Party Cards View */}
                <div className="parties-cards-view">
                    <h3>📋 Party Directory</h3>
                    <div className="parties-grid">
                        {parties.map((party) => (
                            <div key={party.id} className="party-card" style={{ borderTopColor: party.color }}>
                                <div className="party-card-header">
                                    <div className="party-symbol">{party.symbol || '🎭'}</div>
                                    <div className="party-info">
                                        <div className="party-name">{party.name}</div>
                                        <div className="party-code-badge">{party.code}</div>
                                    </div>
                                </div>
                                <div className="party-card-body">
                                    {party.slogan && <p className="party-slogan">"{party.slogan}"</p>}
                                    <div className="party-details">
                                        {party.website && <span>🌐 {party.website}</span>}
                                        {party.email && <span>📧 {party.email}</span>}
                                        {party.phone && <span>📞 {party.phone}</span>}
                                    </div>
                                </div>
                                <div className="party-card-footer">
                                    <span className={`status-badge ${party.is_active ? 'active' : 'inactive'}`}>
                                        {party.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="candidate-count">{party.candidate_count || 0} Candidates</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content large">
                            <div className="modal-header">
                                <h3>{editingParty ? 'Edit Political Party' : 'Register New Political Party'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingParty(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Party Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                            placeholder="e.g., United Democratic Alliance"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Party Code *</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            required
                                            placeholder="e.g., UDA, ODM"
                                            maxLength="10"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Party Symbol</label>
                                        <input
                                            type="text"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                            placeholder="e.g., 🟢, 🔴, 🟡"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Party Color</label>
                                        <div className="color-input-wrapper">
                                            <input
                                                type="color"
                                                value={formData.color}
                                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                            />
                                            <span className="color-value">{formData.color}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Slogan</label>
                                    <input
                                        type="text"
                                        value={formData.slogan}
                                        onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                                        placeholder="Party slogan/motto"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            placeholder="info@party.or.ke"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            placeholder="0700000000"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Headquarters</label>
                                        <input
                                            type="text"
                                            value={formData.headquarters}
                                            onChange={(e) => setFormData({...formData, headquarters: e.target.value})}
                                            placeholder="City, Location"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Registration Date</label>
                                        <input
                                            type="date"
                                            value={formData.registration_date}
                                            onChange={(e) => setFormData({...formData, registration_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingParty(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingParty ? 'Update' : 'Register'}</button>
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