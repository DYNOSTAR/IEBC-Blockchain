import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const CountiesManagement = () => {
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCounty, setEditingCounty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        population: '',
        registered_voters: '',
        headquarters: ''
    });

    useEffect(() => {
        loadCounties();
    }, []);

    const loadCounties = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get('http://localhost:5000/api/admin/counties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setCounties(response.data.counties);
                setError('');
            } else {
                setError('Failed to load counties');
            }
        } catch (error) {
            console.error('Error loading counties:', error);
            setError(error.response?.data?.error || 'Failed to load counties');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.code) {
            setError('County name and code are required');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = editingCounty 
                ? `http://localhost:5000/api/admin/counties/${editingCounty.id}`
                : 'http://localhost:5000/api/admin/counties';
            const method = editingCounty ? 'put' : 'post';
            
            const response = await axios[method](url, {
                name: formData.name,
                code: formData.code,
                population: formData.population || 0,
                registered_voters: formData.registered_voters || 0,
                headquarters: formData.headquarters || ''
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingCounty ? 'County updated successfully!' : 'County added successfully!');
                loadCounties();
                setShowModal(false);
                setEditingCounty(null);
                setFormData({ name: '', code: '', population: '', registered_voters: '', headquarters: '' });
                setError('');
            }
        } catch (error) {
            console.error('Error saving county:', error);
            setError(error.response?.data?.error || 'Failed to save county');
        }
    };

    const handleEdit = (county) => {
        setEditingCounty(county);
        setFormData({
            name: county.name,
            code: county.code,
            population: county.population || '',
            registered_voters: county.registered_voters || '',
            headquarters: county.headquarters || ''
        });
        setShowModal(true);
        setError('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this county?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/admin/counties/${id}`, {
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
            <AdminLayout>
                <div className="admin-loading">Loading counties...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Counties Management (47 Counties)</h2>
                        <p>Manage all 47 counties of Kenya</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New County
                    </button>
                </div>

                {error && (
                    <div className="error-message" style={{ marginBottom: '20px', padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>County Name</th>
                                <th>Headquarters</th>
                                <th>Population</th>
                                <th>Registered Voters</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {counties.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No counties found. Please add some.</td>
                                </tr>
                            ) : (
                                counties.map((county) => (
                                    <tr key={county.id}>
                                        <td><strong>{county.code}</strong></td>
                                        <td>{county.name}</td>
                                        <td>{county.headquarters || '-'}</td>
                                        <td>{county.population?.toLocaleString() || 0}</td>
                                        <td>{county.registered_voters?.toLocaleString() || 0}</td>
                                        <td>
                                            <button className="edit-btn" onClick={() => handleEdit(county)}>✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(county.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
                                    setError('');
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
                                <div className="form-group">
                                    <label>County Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        required
                                        placeholder="e.g., 001, 002"
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
                                {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingCounty(null);
                                        setError('');
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingCounty ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CountiesManagement;