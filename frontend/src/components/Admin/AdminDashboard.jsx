import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import '../../styles/admin-dashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_counties: 0,
        total_constituencies: 0,
        total_wards: 0,
        total_polling_stations: 0,
        total_parties: 0,
        total_voters: 0,
        total_candidates: 0,
        total_elections: 0,
        total_votes_cast: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        loadStats();
        loadRecentActivities();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/statistics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.statistics);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentActivities = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/audit-logs?limit=10', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setRecentActivities(response.data.auditLogs);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    };

    const statCards = [
        { title: 'Counties', value: stats.total_counties, icon: '🗺️', color: '#00A651', target: 47 },
        { title: 'Constituencies', value: stats.total_constituencies, icon: '📍', color: '#1E3C72', target: 290 },
        { title: 'Wards', value: stats.total_wards, icon: '🏘️', color: '#F59E0B', target: null },
        { title: 'Polling Stations', value: stats.total_polling_stations, icon: '🏢', color: '#8B5CF6', target: null },
        { title: 'Political Parties', value: stats.total_parties, icon: '🎭', color: '#EC4899', target: null },
        { title: 'Registered Voters', value: stats.total_voters, icon: '👥', color: '#06B6D4', target: null },
        { title: 'Candidates', value: stats.total_candidates, icon: '👥', color: '#F97316', target: null },
        { title: 'Votes Cast', value: stats.total_votes_cast, icon: '🗳️', color: '#A855F7', target: null }
    ];

    return (
        <AdminLayout>
            <div className="admin-dashboard-page">
                <div className="dashboard-header">
                    <h2>Dashboard Overview</h2>
                    <p>Welcome to the IEBC Election Management System</p>
                </div>

                <div className="stats-grid">
                    {statCards.map((stat, index) => (
                        <div key={index} className="stat-card" style={{ borderBottomColor: stat.color }}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <div className="stat-value">{stat.value?.toLocaleString() || 0}</div>
                                <div className="stat-title">{stat.title}</div>
                                {stat.target && (
                                    <div className="stat-progress">
                                        <div className="progress-bar" style={{ width: `${(stat.value / stat.target) * 100}%` }}></div>
                                        <span>{Math.round((stat.value / stat.target) * 100)}% Complete</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="dashboard-grid">
                    <div className="recent-activities">
                        <h3>Recent Activities</h3>
                        <div className="activities-list">
                            {recentActivities.map((activity, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-icon">
                                        {activity.action === 'CREATE_COUNTY' && '➕'}
                                        {activity.action === 'CREATE_CONSTITUENCY' && '📍'}
                                        {activity.action === 'LOGIN' && '🔑'}
                                        {activity.action === 'CREATE_PARTY' && '🎭'}
                                        {!activity.action && '📝'}
                                    </div>
                                    <div className="activity-details">
                                        <div className="activity-action">{activity.action}</div>
                                        <div className="activity-description">{activity.details}</div>
                                        <div className="activity-time">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="actions-grid">
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/counties'}>
                                <span>🗺️</span> Add County
                            </button>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/constituencies'}>
                                <span>📍</span> Add Constituency
                            </button>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/parties'}>
                                <span>🎭</span> Add Party
                            </button>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/candidates'}>
                                <span>👥</span> Add Candidate
                            </button>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/elections'}>
                                <span>📅</span> Create Election
                            </button>
                            <button className="quick-action-btn" onClick={() => window.location.href = '/admin/voters'}>
                                <span>👤</span> View Voters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;