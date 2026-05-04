import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const ConstituenciesManagement = () => {
    const [constituencies, setConstituencies] = useState([]);
    const [counties, setCounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingConstituency, setEditingConstituency] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        county_id: ''
    });

    useEffect(() => {
        loadConstituencies();
        loadCounties();
    }, []);

    const loadConstituencies = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/constituencies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
                setError('');
            } else {
                setError('Failed to load constituencies');
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
            setError(error.response?.data?.error || 'Failed to load constituencies');
        } finally {
            setLoading(false);
        }
    };

    const loadCounties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/counties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCounties(response.data.counties);
            }
        } catch (error) {
            console.error('Error loading counties:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingConstituency 
                ? `http://localhost:5000/api/admin/constituencies/${editingConstituency.id}`
                : 'http://localhost:5000/api/admin/constituencies';
            const method = editingConstituency ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingConstituency ? 'Constituency updated successfully!' : 'Constituency added successfully!');
                loadConstituencies();
                setShowModal(false);
                setEditingConstituency(null);
                setFormData({ name: '', code: '', county_id: '' });
            }
        } catch (error) {
            console.error('Error saving constituency:', error);
            alert(error.response?.data?.error || 'Failed to save constituency');
        }
    };

    const handleEdit = (constituency) => {
        setEditingConstituency(constituency);
        setFormData({
            name: constituency.name,
            code: constituency.code,
            county_id: constituency.county_id
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this constituency?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/admin/constituencies/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Constituency deleted successfully!');
                loadConstituencies();
            } catch (error) {
                console.error('Error deleting constituency:', error);
                alert('Failed to delete constituency');
            }
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading constituencies...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Constituencies Management (290 Constituencies)</h2>
                        <p>Manage all constituencies across Kenya</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Constituency
                    </button>
                </div>

                {error && (
                    <div className="error-message" style={{ marginBottom: '20px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>County</th>
                                <th>Code</th>
                                <th>Constituency Name</th>
                                <th>Registered Voters</th>
                                <th>Wards</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {constituencies.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No constituencies found. Please add some.</td>
                                </tr>
                            ) : (
                                constituencies.map((constituency) => (
                                    <tr key={constituency.id}>
                                        <td>{constituency.county_name}</td>
                                        <td>{constituency.code}</td>
                                        <td><strong>{constituency.name}</strong></td>
                                        <td>{constituency.registered_voters?.toLocaleString() || 0}</td>
                                        <td>{constituency.ward_count || 0}</td>
                                        <td>
                                            <button className="edit-btn" onClick={() => handleEdit(constituency)}>✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(constituency.id)}>🗑️</button>
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
                                <h3>{editingConstituency ? 'Edit Constituency' : 'Add New Constituency'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingConstituency(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Select County *</label>
                                    <select
                                        value={formData.county_id}
                                        onChange={(e) => setFormData({...formData, county_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select County</option>
                                        {counties.map(county => (
                                            <option key={county.id} value={county.id}>{county.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Constituency Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                        placeholder="e.g., Starehe, Westlands"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Constituency Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        required
                                        placeholder="e.g., 001, 002"
                                        maxLength="3"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingConstituency(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingConstituency ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ConstituenciesManagement;