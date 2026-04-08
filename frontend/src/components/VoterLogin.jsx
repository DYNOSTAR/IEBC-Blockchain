import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import '../styles/main.css';
import '../styles/voter-login.css';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nationalId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [verificationData, setVerificationData] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/voter/login', {
                nationalId: formData.nationalId,
                password: formData.password
            });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.voter));
                localStorage.setItem('role', 'voter');
                
                navigate('/voting');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRegistration = async () => {
        if (!formData.nationalId) {
            setError('Please enter your National ID to verify');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/verify-voter', {
                nationalId: formData.nationalId
            });
            if (response.data.success) {
                setVerificationData(response.data.voter);
                setShowVerification(true);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Voter not found');
            setVerificationData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-login-page">
            <Header />
            <main className="login-main">
                <div className="container">
                    <div className="login-wrapper">
                        <div className="login-card">
                            <div className="login-header">
                                <div className="login-icon">🗳️</div>
                                <h1>Voter Login</h1>
                                <p>Access your voting dashboard</p>
                            </div>

                            {!showVerification ? (
                                <>
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label className="form-label">National ID Number</label>
                                            <input
                                                type="text"
                                                name="nationalId"
                                                value={formData.nationalId}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Enter your National ID (e.g., 12345678)"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="form-input"
                                                placeholder="Enter your password"
                                                required
                                            />
                                        </div>

                                        {error && (
                                            <div className="error-message">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="login-btn"
                                        >
                                            {loading ? 'Logging in...' : 'Login to Vote'}
                                        </button>
                                    </form>

                                    <div className="divider">
                                        <span>or</span>
                                    </div>

                                    <button
                                        onClick={handleVerifyRegistration}
                                        className="verify-btn"
                                    >
                                        Verify Registration Status
                                    </button>
                                </>
                            ) : (
                                <div>
                                    <div className="verification-result">
                                        <h3>✓ Voter Found</h3>
                                        <div className="voter-details">
                                            <p><strong>Name:</strong> {verificationData?.fullName}</p>
                                            <p><strong>National ID:</strong> {formData.nationalId}</p>
                                            <p><strong>County:</strong> {verificationData?.county}</p>
                                            <p><strong>Polling Station:</strong> {verificationData?.pollingStation}</p>
                                            <p><strong>Ward:</strong> {verificationData?.ward}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowVerification(false)}
                                        className="login-btn"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            )}

                            <div className="help-text">
                                <p>Need help? Contact IEBC helpline: 0700-111-111</p>
                                <p className="mt-2">Default password for testing: Voter@2027!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default VoterLogin;