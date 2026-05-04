import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const PoliticalPartiesManagement = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
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
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/parties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setParties(response.data.parties);
            }
        } catch (error) {
            console.error('Error loading parties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingParty 
                ? `http://localhost:5000/api/admin/parties/${editingParty.id}`
                : 'http://localhost:5000/api/admin/parties';
            const method = editingParty ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingParty ? 'Party updated successfully!' : 'Party created successfully!');
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
            alert('Failed to save party');
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
        if (window.confirm('Are you sure you want to delete this political party?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/admin/parties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Party deleted successfully!');
                loadParties();
            } catch (error) {
                console.error('Error deleting party:', error);
                alert('Failed to delete party');
            }
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading political parties...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Political Parties Management</h2>
                        <p>Manage all registered political parties in Kenya</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Party
                    </button>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Party Code</th>
                                <th>Party Name</th>
                                <th>Color</th>
                                <th>Slogan</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parties.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center' }}>No political parties found</td>
                                </tr>
                            ) : (
                                parties.map((party) => (
                                    <tr key={party.id}>
                                        <td style={{ fontSize: '1.5rem' }}>{party.symbol || '🎭'}</td>
                                        <td><strong>{party.code}</strong></td>
                                        <td>{party.name}</td>
                                        <td>
                                            <div style={{ 
                                                width: '30px', 
                                                height: '30px', 
                                                backgroundColor: party.color,
                                                borderRadius: '5px',
                                                border: '1px solid #ddd'
                                            }}></div>
                                        </td>
                                        <td>{party.slogan || '-'}</td>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content large">
                            <div className="modal-header">
                                <h3>{editingParty ? 'Edit Political Party' : 'Add New Political Party'}</h3>
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
                                            placeholder="e.g., 🟢, 🔴"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Party Color</label>
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({...formData, color: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Slogan</label>
                                    <input
                                        type="text"
                                        value={formData.slogan}
                                        onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Headquarters</label>
                                        <input
                                            type="text"
                                            value={formData.headquarters}
                                            onChange={(e) => setFormData({...formData, headquarters: e.target.value})}
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
                                    <button type="submit" className="submit-btn">{editingParty ? 'Update' : 'Create'}</button>
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