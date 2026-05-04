import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const ReportsManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setReports(response.data.reports);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, resolutionNotes) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/reports/${id}/status`, 
                { status, resolution_notes: resolutionNotes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Report status updated!');
            loadReports();
            setSelectedReport(null);
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to update report');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'status-pending',
            reviewing: 'status-reviewing',
            resolved: 'status-resolved',
            rejected: 'status-rejected'
        };
        return badges[status] || 'status-pending';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading reports...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Reports Management</h2>
                        <p>View and manage voter reports and complaints</p>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Reported By</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <span className="report-type">
                                            {report.report_type === 'fraud' && '⚠️ Fraud'}
                                            {report.report_type === 'intimidation' && '😨 Intimidation'}
                                            {report.report_type === 'technical' && '🔧 Technical'}
                                            {report.report_type === 'bribery' && '💰 Bribery'}
                                            {report.report_type === 'other' && '📝 Other'}
                                        </span>
                                    </td>
                                    <td><strong>{report.title}</strong></td>
                                    <td>{report.first_name} {report.last_name}<br/><small>{report.national_id}</small></td>
                                    <td>{report.location}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadge(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button className="view-btn" onClick={() => setSelectedReport(report)}>👁️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {selectedReport && (
                    <div className="modal-overlay">
                        <div className="modal-content large">
                            <div className="modal-header">
                                <h3>Report Details</h3>
                                <button className="close-modal" onClick={() => setSelectedReport(null)}>×</button>
                            </div>
                            <div className="report-details">
                                <p><strong>Title:</strong> {selectedReport.title}</p>
                                <p><strong>Type:</strong> {selectedReport.report_type}</p>
                                <p><strong>Reported by:</strong> {selectedReport.first_name} {selectedReport.last_name} ({selectedReport.national_id})</p>
                                <p><strong>Location:</strong> {selectedReport.location}</p>
                                <p><strong>Description:</strong></p>
                                <p className="description-text">{selectedReport.description}</p>
                                {selectedReport.evidence_url && (
                                    <p><strong>Evidence:</strong> <a href={selectedReport.evidence_url} target="_blank" rel="noopener noreferrer">View Evidence</a></p>
                                )}
                                <p><strong>Current Status:</strong> {selectedReport.status}</p>
                                
                                <div className="form-group">
                                    <label>Update Status</label>
                                    <select
                                        defaultValue={selectedReport.status}
                                        onChange={(e) => handleStatusUpdate(selectedReport.id, e.target.value, document.getElementById('resolutionNotes').value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="reviewing">Under Review</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Resolution Notes</label>
                                    <textarea
                                        id="resolutionNotes"
                                        rows="3"
                                        defaultValue={selectedReport.resolution_notes || ''}
                                        placeholder="Add resolution notes..."
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="cancel-btn" onClick={() => setSelectedReport(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ReportsManagement;