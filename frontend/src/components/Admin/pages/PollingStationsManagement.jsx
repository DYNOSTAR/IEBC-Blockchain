import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const PollingStationsManagement = () => {
    const [pollingStations, setPollingStations] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStation, setEditingStation] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        ward_id: '',
        location: '',
        capacity: ''
    });

    useEffect(() => {
        loadPollingStations();
        loadWards();
    }, []);

    const loadPollingStations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/polling-stations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPollingStations(response.data.pollingStations);
            }
        } catch (error) {
            console.error('Error loading polling stations:', error);
        } finally {
            setLoading(false);
        }
    };

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
        }
    };
    const handleEdit = (station) => {
    setEditingStation(station);
    setFormData({
        name: station.name,
        code: station.code,
        ward_id: station.ward_id,
        location: station.location || '',
        capacity: station.capacity || ''
    });
    setShowModal(true);
};

const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this polling station?')) {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/polling-stations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Polling station deleted successfully!');
            loadPollingStations();
        } catch (error) {
            console.error('Error deleting polling station:', error);
            alert('Failed to delete polling station');
        }
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingStation 
                ? `http://localhost:5000/api/admin/polling-stations/${editingStation.id}`
                : 'http://localhost:5000/api/admin/polling-stations';
            const method = editingStation ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingStation ? 'Polling Station updated successfully!' : 'Polling Station added successfully!');
                loadPollingStations();
                setShowModal(false);
                setEditingStation(null);
                setFormData({ name: '', code: '', ward_id: '', location: '', capacity: '' });
            }
        } catch (error) {
            console.error('Error saving polling station:', error);
            alert('Failed to save polling station');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading polling stations...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Polling Stations Management</h2>
                        <p>Manage all polling stations across Kenya</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add Polling Station
                    </button>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Station Name</th>
                                <th>County</th>
                                <th>Constituency</th>
                                <th>Ward</th>
                                <th>Location</th>
                                <th>Capacity</th>
                                <th>Registered Voters</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pollingStations.map((station) => (
                                <tr key={station.id}>
                                    <td><strong>{station.code}</strong></td>
                                    <td>{station.name}</td>
                                    <td>{station.county_name}</td>
                                    <td>{station.constituency_name}</td>
                                    <td>{station.ward_name}</td>
                                    <td>{station.location || '-'}</td>
                                    <td>{station.capacity || '-'}</td>
                                    <td>{station.registered_voters?.toLocaleString() || 0}</td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(station)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(station.id)}>🗑️</button>
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
                                <h3>{editingStation ? 'Edit Polling Station' : 'Add Polling Station'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingStation(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Select Ward *</label>
                                    <select
                                        value={formData.ward_id}
                                        onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                                        required
                                    >
                                        <option value="">Select Ward</option>
                                        {wards.map(ward => (
                                            <option key={ward.id} value={ward.id}>
                                                {ward.county_name} - {ward.constituency_name} - {ward.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Station Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Station Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingStation(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingStation ? 'Update' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default PollingStationsManagement;