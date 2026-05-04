import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';

const SuperAdminStatistics = () => {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/statistics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setStats(response.data.statistics);
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-loading">Loading statistics...</div>;

    return (
        <SuperAdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <h2>System Statistics</h2>
                    <p>Complete overview of the IEBC system</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card"><div className="stat-icon">👨‍💼</div><div className="stat-info"><div className="stat-value">{stats.total_admins || 0}</div><div className="stat-title">Total Admins</div></div></div>
                    <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-info"><div className="stat-value">{stats.total_voters || 0}</div><div className="stat-title">Registered Voters</div></div></div>
                    <div className="stat-card"><div className="stat-icon">🗺️</div><div className="stat-info"><div className="stat-value">{stats.total_counties || 0}</div><div className="stat-title">Counties</div></div></div>
                    <div className="stat-card"><div className="stat-icon">📍</div><div className="stat-info"><div className="stat-value">{stats.total_constituencies || 0}</div><div className="stat-title">Constituencies</div></div></div>
                    <div className="stat-card"><div className="stat-icon">🏘️</div><div className="stat-info"><div className="stat-value">{stats.total_wards || 0}</div><div className="stat-title">Wards</div></div></div>
                    <div className="stat-card"><div className="stat-icon">🏢</div><div className="stat-info"><div className="stat-value">{stats.total_polling_stations || 0}</div><div className="stat-title">Polling Stations</div></div></div>
                    <div className="stat-card"><div className="stat-icon">🎭</div><div className="stat-info"><div className="stat-value">{stats.total_parties || 0}</div><div className="stat-title">Political Parties</div></div></div>
                    <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-info"><div className="stat-value">{stats.total_candidates || 0}</div><div className="stat-title">Total Candidates</div></div></div>
                    <div className="stat-card"><div className="stat-icon">👑</div><div className="stat-info"><div className="stat-value">{stats.total_presidential_candidates || 0}</div><div className="stat-title">Presidential Candidates</div></div></div>
                    <div className="stat-card"><div className="stat-icon">🗳️</div><div className="stat-info"><div className="stat-value">{stats.total_votes_cast || 0}</div><div className="stat-title">Votes Cast</div></div></div>
                    <div className="stat-card"><div className="stat-icon">⚠️</div><div className="stat-info"><div className="stat-value">{stats.total_reports || 0}</div><div className="stat-title">Total Reports</div></div></div>
                    <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><div className="stat-value">{stats.pending_reports || 0}</div><div className="stat-title">Pending Reports</div></div></div>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminStatistics;