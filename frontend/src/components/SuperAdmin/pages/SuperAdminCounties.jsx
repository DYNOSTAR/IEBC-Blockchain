import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-counties.css';

const SuperAdminCounties = () => {
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCounty, setEditingCounty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        headquarters: '',
        population: '',
        registered_voters: ''
    });

    useEffect(() => {
        loadCounties();
    }, []);

    const loadCounties = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/counties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setCounties(response.data.counties);
                setError('');
            }
        } catch (error) {
            console.error('Error loading counties:', error);
            setError('Failed to load counties');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingCounty 
                ? `http://localhost:5000/api/super-admin/counties/${editingCounty.id}`
                : 'http://localhost:5000/api/super-admin/counties';
            const method = editingCounty ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingCounty ? 'County updated successfully!' : 'County added successfully!');
                loadCounties();
                setShowModal(false);
                setEditingCounty(null);
                setFormData({ name: '', code: '', headquarters: '', population: '', registered_voters: '' });
            }
        } catch (error) {
            console.error('Error saving county:', error);
            alert(error.response?.data?.error || 'Failed to save county');
        }
    };

    const handleEdit = (county) => {
        setEditingCounty(county);
        setFormData({
            name: county.name,
            code: county.code,
            headquarters: county.headquarters || '',
            population: county.population || '',
            registered_voters: county.registered_voters || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('⚠️ WARNING: Deleting a county will delete all its constituencies, wards, and polling stations! Are you sure?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/counties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('County deleted successfully!');
                loadCounties();
            } catch (error) {
                console.error('Error deleting county:', error);
                alert(error.response?.data?.error || 'Failed to delete county');
            }
        }
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading counties...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-counties-page">
                <div className="page-header">
                    <div>
                        <h1>🏛️ Counties Management</h1>
                        <p>Manage all 47 counties of Kenya (Super Admin - Country Level Control)</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New County
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-number">{counties.length}</span>
                        <span className="stat-label">Total Counties</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">47</span>
                        <span className="stat-label">Target (Kenya)</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{counties.filter(c => c.constituency_count).reduce((a, b) => a + (b.constituency_count || 0), 0)}</span>
                        <span className="stat-label">Total Constituencies</span>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>County Name</th>
                                <th>Headquarters</th>
                                <th>Population</th>
                                <th>Registered Voters</th>
                                <th>Constituencies</th>
                                <th>Wards</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counties.map((county) => (
                                <tr key={county.id}>
                                    <td><span className="county-code">{county.code}</span></td>
                                    <td><strong>{county.name}</strong></td>
                                    <td>{county.headquarters || '-'}</td>
                                    <td>{county.population?.toLocaleString() || 0}</td>
                                    <td>{county.registered_voters?.toLocaleString() || 0}</td>
                                    <td>{county.constituency_count || 0}</td>
                                    <td>{county.ward_count || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(county)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(county.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>{editingCounty ? 'Edit County' : 'Add New County'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingCounty(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>County Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                        placeholder="e.g., Nairobi, Mombasa"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>County Code *</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                                            required
                                            placeholder="e.g., 001"
                                            maxLength="3"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Headquarters</label>
                                        <input
                                            type="text"
                                            value={formData.headquarters}
                                            onChange={(e) => setFormData({...formData, headquarters: e.target.value})}
                                            placeholder="e.g., Nairobi City"
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Population</label>
                                        <input
                                            type="number"
                                            value={formData.population}
                                            onChange={(e) => setFormData({...formData, population: e.target.value})}
                                            placeholder="Total population"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Registered Voters</label>
                                        <input
                                            type="number"
                                            value={formData.registered_voters}
                                            onChange={(e) => setFormData({...formData, registered_voters: e.target.value})}
                                            placeholder="Number of registered voters"
                                        />
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingCounty(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingCounty ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCounties;