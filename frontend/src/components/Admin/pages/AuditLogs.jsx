import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setLogs(response.data.auditLogs);
            }
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.action?.toLowerCase().includes(filter.toLowerCase()) ||
        log.details?.toLowerCase().includes(filter.toLowerCase()) ||
        log.first_name?.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading audit logs...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Audit Logs</h2>
                        <p>Track all system activities</p>
                    </div>
                </div>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.first_name} {log.last_name}<br/><small>{log.email}</small></td>
                                    <td>
                                        <span className="action-badge">{log.action}</span>
                                    </td>
                                    <td>{log.details}</td>
                                    <td>{log.ip_address || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AuditLogs;