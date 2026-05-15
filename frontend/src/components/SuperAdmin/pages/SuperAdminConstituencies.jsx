import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-constituencies.css';

const SuperAdminConstituencies = () => {
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
            const response = await axios.get('http://localhost:5000/api/super-admin/constituencies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
                setError('');
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
            setError('Failed to load constituencies');
        } finally {
            setLoading(false);
        }
    };

    const loadCounties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/counties', {
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
        if (!formData.county_id) {
            alert('Please select a county');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = editingConstituency 
                ? `http://localhost:5000/api/super-admin/constituencies/${editingConstituency.id}`
                : 'http://localhost:5000/api/super-admin/constituencies';
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
        if (window.confirm('⚠️ WARNING: Deleting a constituency will delete all its wards and polling stations! Are you sure?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/constituencies/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Constituency deleted successfully!');
                loadConstituencies();
            } catch (error) {
                console.error('Error deleting constituency:', error);
                alert(error.response?.data?.error || 'Failed to delete constituency');
            }
        }
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading constituencies...</div>
            </SuperAdminLayout>
        );
    }

    // Group constituencies by county for better display
    const groupedConstituencies = constituencies.reduce((acc, constituency) => {
        const countyName = constituency.county_name;
        if (!acc[countyName]) {
            acc[countyName] = [];
        }
        acc[countyName].push(constituency);
        return acc;
    }, {});

    return (
        <SuperAdminLayout>
            <div className="super-admin-constituencies-page">
                <div className="page-header">
                    <div>
                        <h1>📍 Constituencies Management</h1>
                        <p>Manage all 290 constituencies of Kenya (Super Admin - Country Level Control)</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Constituency
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-number">{constituencies.length}</span>
                        <span className="stat-label">Total Constituencies</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">290</span>
                        <span className="stat-label">Target (Kenya)</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{Object.keys(groupedConstituencies).length}</span>
                        <span className="stat-label">Counties Covered</span>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>County</th>
                                <th>Code</th>
                                <th>Constituency Name</th>
                                <th>Wards</th>
                                <th>Polling Stations</th>
                                <th>Registered Voters</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {constituencies.map((constituency) => (
                                <tr key={constituency.id}>
                                    <td>
                                        <span className="county-badge">{constituency.county_name}</span>
                                    </td>
                                    <td><span className="constituency-code">{constituency.code}</span></td>
                                    <td><strong>{constituency.name}</strong></td>
                                    <td>{constituency.ward_count || 0}</td>
                                    <td>{constituency.polling_station_count || 0}</td>
                                    <td>{constituency.registered_voters?.toLocaleString() || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(constituency)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(constituency.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Grouped View by County */}
                <div className="grouped-view">
                    <h3>📊 Constituencies by County</h3>
                    {Object.entries(groupedConstituencies).map(([countyName, countyConstituencies]) => (
                        <div key={countyName} className="county-group">
                            <div className="county-group-header">
                                <span className="county-icon">🏛️</span>
                                <span className="county-name">{countyName}</span>
                                <span className="county-count">{countyConstituencies.length} constituencies</span>
                            </div>
                            <div className="constituencies-list">
                                {countyConstituencies.map(con => (
                                    <div key={con.id} className="constituency-chip">
                                        {con.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
                                        placeholder="e.g., 001"
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
        </SuperAdminLayout>
    );
};

export default SuperAdminConstituencies;