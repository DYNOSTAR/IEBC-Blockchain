import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const AdminProfile = () => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        position: ''
    });

    useEffect(() => {
        loadAdminProfile();
    }, []);

    const loadAdminProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setAdmin(response.data.admin);
                setFormData({
                    first_name: response.data.admin.first_name,
                    last_name: response.data.admin.last_name,
                    email: response.data.admin.email || '',
                    phone: response.data.admin.phone || '',
                    department: response.data.admin.department || '',
                    position: response.data.admin.position || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:5000/api/admin/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                alert('Profile updated successfully!');
                setEditMode(false);
                loadAdminProfile();
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading profile...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Admin Profile</h2>
                        <p>View and edit your profile information</p>
                    </div>
                    {!editMode && (
                        <button className="add-btn" onClick={() => setEditMode(true)}>
                            ✏️ Edit Profile
                        </button>
                    )}
                </div>

                {editMode ? (
                    <form onSubmit={handleSubmit} className="profile-form">
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
                                <label>Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Position</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                            <button type="submit" className="submit-btn">Save Changes</button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-view">
                        <div className="profile-card">
                            <div className="profile-avatar">👨‍💼</div>
                            <div className="profile-info">
                                <p><strong>Name:</strong> {admin?.first_name} {admin?.last_name}</p>
                                <p><strong>National ID:</strong> {admin?.national_id}</p>
                                <p><strong>Email:</strong> {admin?.email || 'Not set'}</p>
                                <p><strong>Phone:</strong> {admin?.phone || 'Not set'}</p>
                                <p><strong>Department:</strong> {admin?.department || 'Not set'}</p>
                                <p><strong>Position:</strong> {admin?.position || 'Not set'}</p>
                                <p><strong>Role:</strong> <span className="role-badge role-admin">{admin?.role}</span></p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminProfile;