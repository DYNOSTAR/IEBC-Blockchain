import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';
import '../../styles/super-admin.css';

const SuperAdminAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        national_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'admin',
        password: '',
        department: '',
        position: ''
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/admins', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setAdmins(response.data.admins);
            }
        } catch (error) {
            console.error('Error loading admins:', error);
            alert('Failed to load admins. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/super-admin/admins', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert('Admin created successfully!');
                loadAdmins();
                setShowModal(false);
                setFormData({
                    national_id: '',
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    role: 'admin',
                    password: '',
                    department: '',
                    position: ''
                });
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            alert(error.response?.data?.error || 'Failed to create admin');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/admins/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Admin deleted successfully!');
                loadAdmins();
            } catch (error) {
                console.error('Error deleting admin:', error);
                alert('Failed to delete admin');
            }
        }
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading admins...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Manage Administrators</h2>
                        <p>Create and manage system administrators</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Admin
                    </button>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>National ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center' }}>No admins found</td>
                                </tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td>{admin.national_id}</td>
                                        <td>{admin.first_name} {admin.last_name}</td>
                                        <td>{admin.email || '-'}</td>
                                        <td>
                                            <span className={`role-badge role-${admin.role}`}>
                                                {admin.role === 'super_admin' ? 'Super Admin' : 
                                                 admin.role === 'admin' ? 'Admin' : 'IEBC Official'}
                                            </span>
                                        </td>
                                        <td>{admin.department || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                                                {admin.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="delete-btn" onClick={() => handleDelete(admin.id)}>🗑️</button>
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
                                <h3>Add New Admin</h3>
                                <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>National ID *</label>
                                        <input
                                            type="text"
                                            value={formData.national_id}
                                            onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Password *</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                required
                                            />
                                            <button 
                                                type="button"
                                                className="toggle-password-btn"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name *</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name *</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            required
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="iebc_official">IEBC Official</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Position</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="submit-btn">Create Admin</button>
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