import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-wards.css';

const SuperAdminWards = () => {
    const [wards, setWards] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/wards', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setWards(response.data.wards);
                setError('');
            }
        } catch (error) {
            console.error('Error loading wards:', error);
            setError('Failed to load wards');
        } finally {
            setLoading(false);
        }
    };

    const loadConstituencies = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/constituencies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.constituency_id) {
            alert('Please select a constituency');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = editingWard 
                ? `http://localhost:5000/api/super-admin/wards/${editingWard.id}`
                : 'http://localhost:5000/api/super-admin/wards';
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
            alert(error.response?.data?.error || 'Failed to save ward');
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
        if (window.confirm('⚠️ WARNING: Deleting a ward will delete all its polling stations! Are you sure?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/wards/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Ward deleted successfully!');
                loadWards();
            } catch (error) {
                console.error('Error deleting ward:', error);
                alert(error.response?.data?.error || 'Failed to delete ward');
            }
        }
    };

    // Group wards by county and constituency
    const groupedWards = wards.reduce((acc, ward) => {
        const countyName = ward.county_name;
        const constituencyName = ward.constituency_name;
        
        if (!acc[countyName]) {
            acc[countyName] = {};
        }
        if (!acc[countyName][constituencyName]) {
            acc[countyName][constituencyName] = [];
        }
        acc[countyName][constituencyName].push(ward);
        return acc;
    }, {});

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading wards...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-wards-page">
                <div className="page-header">
                    <div>
                        <h1>🏘️ Wards Management</h1>
                        <p>Manage all wards across Kenya (Super Admin - Country Level Control)</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Ward
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-number">{wards.length}</span>
                        <span className="stat-label">Total Wards</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{constituencies.length}</span>
                        <span className="stat-label">Constituencies</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{wards.filter(w => w.polling_station_count > 0).length}</span>
                        <span className="stat-label">Wards with Polling Stations</span>
                    </div>
                </div>

                {/* Table View */}
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>County</th>
                                <th>Constituency</th>
                                <th>Ward Name</th>
                                <th>Code</th>
                                <th>Polling Stations</th>
                                <th>Registered Voters</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {wards.map((ward) => (
                                <tr key={ward.id}>
                                    <td>
                                        <span className="county-badge">{ward.county_name}</span>
                                    </td>
                                    <td>{ward.constituency_name}</td>
                                    <td><strong>{ward.name}</strong></td>
                                    <td><span className="ward-code">{ward.code || '-'}</span></td>
                                    <td>{ward.polling_station_count || 0}</td>
                                    <td>{ward.registered_voters?.toLocaleString() || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(ward)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(ward.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Grouped View by County and Constituency */}
                <div className="grouped-view">
                    <h3>📊 Wards by County and Constituency</h3>
                    {Object.entries(groupedWards).map(([countyName, constituencies]) => (
                        <div key={countyName} className="county-group">
                            <div className="county-group-header">
                                <span className="county-icon">🏛️</span>
                                <span className="county-name">{countyName}</span>
                                <span className="county-count">
                                    {Object.keys(constituencies).length} constituencies, 
                                    {Object.values(constituencies).reduce((a, b) => a + b.length, 0)} wards
                                </span>
                            </div>
                            {Object.entries(constituencies).map(([constituencyName, constituencyWards]) => (
                                <div key={constituencyName} className="constituency-group">
                                    <div className="constituency-group-header">
                                        <span className="constituency-icon">📍</span>
                                        <span className="constituency-name">{constituencyName}</span>
                                        <span className="constituency-count">{constituencyWards.length} wards</span>
                                    </div>
                                    <div className="wards-list">
                                        {constituencyWards.map(ward => (
                                            <div key={ward.id} className="ward-chip">
                                                {ward.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
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
                                        placeholder="e.g., Kitisuru, Parklands"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ward Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        placeholder="e.g., W001"
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
        </SuperAdminLayout>
    );
};

export default SuperAdminWards;