import React, { useState } from 'react';
import axios from 'axios';
import '../styles/report-case.css';

const ReportCase = () => {
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        location: '',
        evidence: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const reportTypes = [
        { value: 'fraud', label: 'Voter Fraud', icon: '⚠️' },
        { value: 'intimidation', label: 'Voter Intimidation', icon: '😨' },
        { value: 'technical', label: 'Technical Issue', icon: '🔧' },
        { value: 'bribery', label: 'Bribery', icon: '💰' },
        { value: 'other', label: 'Other', icon: '📝' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            evidence: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('type', formData.type);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('location', formData.location);
            if (formData.evidence) {
                data.append('evidence', formData.evidence);
            }

            const response = await axios.post('http://localhost:5000/api/voter/report-case', data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccess('Your report has been submitted. IEBC will review it.');
                setFormData({
                    type: '',
                    title: '',
                    description: '',
                    location: '',
                    evidence: null
                });
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="report-case-container">
            <div className="report-header">
                <h2>⚠️ Report an Incident</h2>
                <p>Report any electoral irregularities or issues you encounter</p>
            </div>

            <div className="report-content">
                <div className="report-info-card">
                    <div className="info-icon">📞</div>
                    <div className="info-text">
                        <h4>Emergency Contacts</h4>
                        <p>IEBC Hotline: <strong>0700-111-111</strong></p>
                        <p>SMS: <strong>22222</strong></p>
                        <p>Email: <strong>reports@iebc.or.ke</strong></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="report-form">
                    <div className="form-group">
                        <label>Report Type *</label>
                        <select name="type" value={formData.type} onChange={handleChange} required>
                            <option value="">Select report type</option>
                            {reportTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Brief title of the incident"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Where did this occur? (Polling station, county, etc.)"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Provide detailed information about the incident..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Evidence (Optional)</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*,video/*,application/pdf"
                        />
                        <small>Upload images, videos, or documents as evidence</small>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <button type="submit" className="submit-report-btn" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportCase;