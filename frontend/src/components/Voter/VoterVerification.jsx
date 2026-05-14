import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/voter-verification.css';

const VoterVerification = () => {
    const navigate = useNavigate();
    const [nationalId, setNationalId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationData, setVerificationData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/verify-voter', {
                nationalId: nationalId.trim()
            });

            if (response.data.success) {
                setVerificationData(response.data.voter);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Voter not found');
            setVerificationData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-verification-page">
            <div className="verification-container">
                <div className="verification-card">
                    <div className="verification-header">
                        <div className="verification-icon">✅</div>
                        <h1>Verify Voter Registration</h1>
                        <p>Check your voter registration status</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>National ID Number</label>
                            <input
                                type="text"
                                value={nationalId}
                                onChange={(e) => setNationalId(e.target.value)}
                                placeholder="Enter your National ID"
                                required
                            />
                        </div>

                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button type="submit" className="verify-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Registration'}
                        </button>
                    </form>

                    {verificationData && (
                        <div className="verification-result">
                            <h3>✅ Voter Found</h3>
                            <div className="result-details">
                                <p><strong>Full Name:</strong> {verificationData.fullName}</p>
                                <p><strong>National ID:</strong> {verificationData.nationalId}</p>
                                <p><strong>Status:</strong> <span className="status-badge">{verificationData.status}</span></p>
                            </div>
                        </div>
                    )}

                    <div className="verification-footer">
                        <p>Not registered? <button onClick={() => navigate('/register')}>Register here</button></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoterVerification;