import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/main.css';
import '../styles/admin-login.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.admin));
                localStorage.setItem('role', 'admin');
                
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            {/* Animated Background */}
            <div className="admin-bg-animation">
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div className="bg-shape shape-3"></div>
                <div className="bg-shape shape-4"></div>
            </div>

            {/* Header Bar */}
            <div className="admin-header-bar">
                <div className="container">
                    <div className="admin-header-content">
                        <div className="admin-logo" onClick={() => navigate('/')}>
                            <div className="logo-icon">🗳️</div>
                            <div className="logo-text">
                                <span className="logo-title">IEBC</span>
                                <span className="logo-subtitle">Blockchain Voting System</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/')} className="back-home-btn">
                            <span>←</span> Back to Home
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-login-main">
                <div className="container">
                    <div className="admin-login-wrapper">
                        {/* Security Badge */}
                        <div className="security-badge">
                            <div className="security-icon">🔐</div>
                            <div className="security-text">
                                <span className="security-title">Secure Area</span>
                                <span className="security-subtitle">Authorized Personnel Only</span>
                            </div>
                        </div>

                        {/* Login Card */}
                        <div className="admin-login-card">
                            <div className="card-header">
                                <div className="card-icon">👨‍💼</div>
                                <h1>Administrator Portal</h1>
                                <p>IEBC Election Management System</p>
                                <div className="admin-badge">Restricted Access</div>
                            </div>

                            <form onSubmit={handleSubmit} className="admin-form">
                                <div className="input-group">
                                    <div className="input-icon">📧</div>
                                    <div className="input-field">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="admin@iebc.or.ke"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <div className="input-icon">🔒</div>
                                    <div className="input-field">
                                        <label>Password</label>
                                        <div className="password-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? "👁️" : "👁️‍🗨️"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="error-message">
                                        <span className="error-icon">⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="admin-login-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="btn-loading">
                                            <span className="spinner"></span>
                                            Authenticating...
                                        </span>
                                    ) : (
                                        <span className="btn-content">
                                            <span>🔑</span>
                                            Access Admin Portal
                                            <span>→</span>
                                        </span>
                                    )}
                                </button>

                                <div className="form-footer">
                                    <div className="security-check">
                                        <div className="check-item">
                                            <span>✓</span> SSL Encrypted
                                        </div>
                                        <div className="check-item">
                                            <span>✓</span> 2FA Enabled
                                        </div>
                                        <div className="check-item">
                                            <span>✓</span> Audit Logged
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="card-footer">
                                <div className="info-box">
                                    <div className="info-icon">ℹ️</div>
                                    <div className="info-text">
                                        <p>This portal is for IEBC officials only.</p>
                                        <p className="info-note">Unauthorized access is prohibited and will be prosecuted.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="info-cards">
                            <div className="info-card">
                                <div className="info-card-icon">🛡️</div>
                                <h4>Blockchain Security</h4>
                                <p>All admin actions are recorded on the blockchain audit trail</p>
                            </div>
                            <div className="info-card">
                                <div className="info-card-icon">📊</div>
                                <h4>Real-time Monitoring</h4>
                                <p>Monitor election progress and results in real-time</p>
                            </div>
                            <div className="info-card">
                                <div className="info-card-icon">🔔</div>
                                <h4>Instant Alerts</h4>
                                <p>Receive notifications for critical system events</p>
                            </div>
                        </div>

                        {/* Test Credentials (for development only) */}
                        <div className="test-credentials">
                            <div className="test-header">
                                <span>🔧</span>
                                <span>Development Test Credentials</span>
                                <span>⚠️</span>
                            </div>
                            <div className="test-content">
                                <div className="test-item">
                                    <span className="test-label">Email:</span>
                                    <code>admin@iebc.or.ke</code>
                                </div>
                                <div className="test-item">
                                    <span className="test-label">Password:</span>
                                    <code>Admin@2027!</code>
                                </div>
                            </div>
                            <div className="test-note">
                                Remove in production environment
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;