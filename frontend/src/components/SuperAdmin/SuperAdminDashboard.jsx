import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';
import '../../styles/super-admin.css';

const SuperAdminDashboard = () => {
    const [adminData, setAdminData] = useState(null);
    const [stats, setStats] = useState({
        total_admins: 0,
        total_voters: 0,
        total_counties: 0,
        total_constituencies: 0,
        total_wards: 0,
        total_polling_stations: 0,
        total_parties: 0,
        total_candidates: 0,
        total_presidential_candidates: 0,
        total_votes_cast: 0,
        total_reports: 0,
        pending_reports: 0
    });
    const [recentAdmins, setRecentAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdminData();
        loadStats();
        loadRecentAdmins();
    }, []);

    const loadAdminData = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                setAdminData(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    };

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/statistics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.statistics);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set some demo stats if API fails
            setStats({
                total_admins: 1,
                total_voters: 0,
                total_counties: 47,
                total_constituencies: 290,
                total_wards: 0,
                total_polling_stations: 0,
                total_parties: 0,
                total_candidates: 0,
                total_presidential_candidates: 0,
                total_votes_cast: 0,
                total_reports: 0,
                pending_reports: 0
            });
        }
    };

    const loadRecentAdmins = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/admins', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setRecentAdmins(response.data.admins.slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { title: 'System Admins', value: stats.total_admins, icon: '👨‍💼', color: '#1E3C72' },
        { title: 'Registered Voters', value: stats.total_voters, icon: '👥', color: '#00A651' },
        { title: 'Counties', value: stats.total_counties, icon: '🗺️', color: '#F59E0B' },
        { title: 'Constituencies', value: stats.total_constituencies, icon: '📍', color: '#8B5CF6' },
        { title: 'Wards', value: stats.total_wards, icon: '🏘️', color: '#EC4899' },
        { title: 'Polling Stations', value: stats.total_polling_stations, icon: '🏢', color: '#06B6D4' },
        { title: 'Political Parties', value: stats.total_parties, icon: '🎭', color: '#F97316' },
        { title: 'Total Candidates', value: stats.total_candidates, icon: '👥', color: '#A855F7' },
        { title: 'Presidential Candidates', value: stats.total_presidential_candidates, icon: '👑', color: '#DC2626' },
        { title: 'Votes Cast', value: stats.total_votes_cast, icon: '🗳️', color: '#00A651' },
        { title: 'Total Reports', value: stats.total_reports, icon: '⚠️', color: '#F59E0B' },
        { title: 'Pending Reports', value: stats.pending_reports, icon: '⏳', color: '#DC2626' }
    ];

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading Super Admin Dashboard...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-dashboard">
                {/* Welcome Section with Admin Data */}
                <div className="welcome-section">
                    <div className="admin-profile-card">
                        <div className="admin-profile-icon">👑</div>
                        <div className="admin-profile-info">
                            <h2>Welcome back, {adminData?.name || adminData?.firstName} {adminData?.lastName}!</h2>
                            <p>Super Administrator - Full System Access</p>
                            <div className="admin-profile-details">
                                <span>📛 National ID: {adminData?.nationalId}</span>
                                <span>👑 Role: Super Admin</span>
                                <span>🔓 Status: Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <div key={index} className="stat-card" style={{ borderBottomColor: stat.color }}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <div className="stat-value">{stat.value?.toLocaleString() || 0}</div>
                                <div className="stat-title">{stat.title}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Admins Section */}
                <div className="recent-admins-section">
                    <h3>Recent Administrators</h3>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>National ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAdmins.length > 0 ? (
                                    recentAdmins.map((admin) => (
                                        <tr key={admin.id}>
                                            <td>{admin.national_id}</td>
                                            <td>{admin.first_name} {admin.last_name}</td>
                                            <td>
                                                <span className={`role-badge role-${admin.role}`}>
                                                    {admin.role === 'super_admin' ? 'Super Admin' : 
                                                     admin.role === 'admin' ? 'Admin' : 'IEBC Official'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                                                    {admin.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center' }}>No admins found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminDashboard;