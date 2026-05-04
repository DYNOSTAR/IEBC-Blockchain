import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const WardsManagement = () => {
    const [wards, setWards] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingWard, setEditingWard] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        constituency_id: ''
    });

    useEffect(() => {
        loadWards();
        loadConstituencies();
    }, []);

    const loadWards = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/wards', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setWards(response.data.wards);
            }
        } catch (error) {
            console.error('Error loading wards:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadConstituencies = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/constituencies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
        }
    };
    const handleEdit = (ward) => {
    setEditingWard(ward);
    setFormData({
        name: ward.name,
        code: ward.code || '',
        constituency_id: ward.constituency_id
    });
    setShowModal(true);
};

const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ward?')) {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/wards/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Ward deleted successfully!');
            loadWards();
        } catch (error) {
            console.error('Error deleting ward:', error);
            alert('Failed to delete ward');
        }
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingWard 
                ? `http://localhost:5000/api/admin/wards/${editingWard.id}`
                : 'http://localhost:5000/api/admin/wards';
            const method = editingWard ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingWard ? 'Ward updated successfully!' : 'Ward added successfully!');
                loadWards();
                setShowModal(false);
                setEditingWard(null);
                setFormData({ name: '', code: '', constituency_id: '' });
            }
        } catch (error) {
            console.error('Error saving ward:', error);
            alert('Failed to save ward');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading wards...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Wards Management</h2>
                        <p>Manage all wards across constituencies</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Ward
                    </button>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>County</th>
                                <th>Constituency</th>
                                <th>Ward Name</th>
                                <th>Code</th>
                                <th>Registered Voters</th>
                                <th>Polling Stations</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wards.map((ward) => (
                                <tr key={ward.id}>
                                    <td>{ward.county_name}</td>
                                    <td>{ward.constituency_name}</td>
                                    <td><strong>{ward.name}</strong></td>
                                    <td>{ward.code || '-'}</td>
                                    <td>{ward.registered_voters?.toLocaleString() || 0}</td>
                                    <td>{ward.polling_station_count || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(ward)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(ward.id)}>🗑️</button>
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
                                <h3>{editingWard ? 'Edit Ward' : 'Add New Ward'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingWard(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Select Constituency *</label>
                                    <select
                                        value={formData.constituency_id}
                                        onChange={(e) => setFormData({...formData, constituency_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Constituency</option>
                                        {constituencies.map(constituency => (
                                            <option key={constituency.id} value={constituency.id}>
                                                {constituency.county_name} - {constituency.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Ward Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ward Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingWard(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingWard ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default WardsManagement;