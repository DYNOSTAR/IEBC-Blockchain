import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/main.css';
import '../styles/voter-login.css';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [loginMethod, setLoginMethod] = useState('id'); // 'id' or 'passport'
    const [formData, setFormData] = useState({
        nationalId: '',
        passportNumber: '',
        password: ''
    });
    const [showRegistration, setShowRegistration] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        firstName: '',
        lastName: '',
        nationalId: '',
        passportNumber: '',
        email: '',
        phone: '',
        county: '',
        constituency: '',
        pollingStation: '',
        password: '',
        confirmPassword: ''
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

    const handleRegistrationChange = (e) => {
        setRegistrationData({
            ...registrationData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const identifier = loginMethod === 'id' ? formData.nationalId : formData.passportNumber;
        
        if (!identifier) {
            setError(`Please enter your ${loginMethod === 'id' ? 'National ID' : 'Passport Number'}`);
            setLoading(false);
            return;
        }

        try {
            // For demo purposes, accept any credentials
            // In production, this would validate against database
            if (identifier && formData.password) {
                const token = 'demo_token_' + Date.now();
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    id: 1,
                    nationalId: identifier,
                    firstName: 'Demo',
                    lastName: 'Voter',
                    hasVoted: false
                }));
                localStorage.setItem('role', 'voter');
                
                navigate('/voting');
            } else {
                setError('Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (registrationData.password !== registrationData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            // Demo registration - in production, this would save to database
            alert('Registration successful! You can now login.');
            setShowRegistration(false);
            // Clear form
            setRegistrationData({
                firstName: '', lastName: '', nationalId: '', passportNumber: '',
                email: '', phone: '', county: '', constituency: '', pollingStation: '',
                password: '', confirmPassword: ''
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRegistration = async () => {
        const identifier = loginMethod === 'id' ? formData.nationalId : formData.passportNumber;
        
        if (!identifier) {
            setError(`Please enter your ${loginMethod === 'id' ? 'National ID' : 'Passport Number'}`);
            return;
        }

        setLoading(true);
        try {
            // Demo verification
            setVerificationData({
                fullName: 'John Doe',
                identifier: identifier,
                county: 'Nairobi',
                constituency: 'Starehe',
                pollingStation: 'PS001',
                status: 'Registered'
            });
            setShowVerification(true);
            setError('');
        } catch (err) {
            setError('Voter not found. Please register first.');
            setVerificationData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-login-page">
            {/* Animated Background */}
            <div className="login-bg-animation">
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div className="bg-shape shape-3"></div>
            </div>

            {/* Header */}
            <div className="login-header-bar">
                <div className="container">
                    <div className="login-header-content">
                        <div className="login-logo" onClick={() => navigate('/')}>
                            <div className="logo-icon">🗳️</div>
                            <div className="logo-text">
                                <span className="logo-title">IEBC</span>
                                <span className="logo-subtitle">Blockchain Voting System</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/')} className="back-home-btn">
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="login-main">
                <div className="container">
                    <div className="login-wrapper">
                        {!showRegistration ? (
                            <>
                                {/* Login Card */}
                                <div className="login-card-enhanced">
                                    <div className="card-header">
                                        <div className="card-icon">🗳️</div>
                                        <h1>Voter Login</h1>
                                        <p>Access your voting dashboard</p>
                                    </div>

                                    {/* Login Method Toggle */}
                                    <div className="login-method-toggle">
                                        <button 
                                            className={`method-btn ${loginMethod === 'id' ? 'active' : ''}`}
                                            onClick={() => setLoginMethod('id')}
                                        >
                                            <span>🆔</span> National ID
                                        </button>
                                        <button 
                                            className={`method-btn ${loginMethod === 'passport' ? 'active' : ''}`}
                                            onClick={() => setLoginMethod('passport')}
                                        >
                                            <span>📘</span> Passport
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="login-form-enhanced">
                                        <div className="input-group">
                                            <div className="input-icon">
                                                {loginMethod === 'id' ? '🆔' : '📘'}
                                            </div>
                                            <div className="input-field">
                                                <label>
                                                    {loginMethod === 'id' ? 'National ID Number' : 'Passport Number'}
                                                </label>
                                                <input
                                                    type="text"
                                                    name={loginMethod === 'id' ? 'nationalId' : 'passportNumber'}
                                                    value={loginMethod === 'id' ? formData.nationalId : formData.passportNumber}
                                                    onChange={handleChange}
                                                    placeholder={loginMethod === 'id' ? 'e.g., 12345678' : 'e.g., A1234567'}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="input-group">
                                            <div className="input-icon">🔒</div>
                                            <div className="input-field">
                                                <label>Password</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="Enter your password"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="error-message">
                                                <span>⚠️</span> {error}
                                            </div>
                                        )}

                                        <button type="submit" className="login-btn-enhanced" disabled={loading}>
                                            {loading ? 'Logging in...' : 'Login to Vote'}
                                        </button>

                                        <div className="forgot-password">
                                            <a href="#">Forgot Password?</a>
                                        </div>
                                    </form>

                                    <div className="divider">
                                        <span>or</span>
                                    </div>

                                    <div className="alternative-actions">
                                        <button onClick={handleVerifyRegistration} className="verify-btn-enhanced">
                                            Verify Registration Status
                                        </button>
                                        <button 
                                            onClick={() => setShowRegistration(true)} 
                                            className="register-btn-enhanced"
                                        >
                                            Create New Account
                                        </button>
                                    </div>

                                    <div className="login-footer-note">
                                        <p>Need help? Contact IEBC helpline: 0700-111-111</p>
                                        <p className="demo-note">Demo: Any ID/Passport + any password works</p>
                                    </div>
                                </div>

                                {/* Info Cards */}
                                <div className="login-info-cards">
                                    <div className="info-card">
                                        <div className="info-icon">✅</div>
                                        <h4>Quick Registration</h4>
                                        <p>Register to vote in minutes</p>
                                    </div>
                                    <div className="info-card">
                                        <div className="info-icon">🔒</div>
                                        <h4>Secure Voting</h4>
                                        <p>Blockchain protected votes</p>
                                    </div>
                                    <div className="info-card">
                                        <div className="info-icon">📱</div>
                                        <h4>24/7 Support</h4>
                                        <p>Helpline available</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Registration Card */
                            <div className="registration-card">
                                <div className="card-header">
                                    <div className="card-icon">📝</div>
                                    <h1>Voter Registration</h1>
                                    <p>Create your voting account</p>
                                </div>

                                <form onSubmit={handleRegister} className="registration-form">
                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">👤</div>
                                            <div className="input-field">
                                                <label>First Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={registrationData.firstName}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">👤</div>
                                            <div className="input-field">
                                                <label>Last Name</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={registrationData.lastName}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🆔</div>
                                            <div className="input-field">
                                                <label>National ID</label>
                                                <input
                                                    type="text"
                                                    name="nationalId"
                                                    value={registrationData.nationalId}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">📘</div>
                                            <div className="input-field">
                                                <label>Passport Number (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="passportNumber"
                                                    value={registrationData.passportNumber}
                                                    onChange={handleRegistrationChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">📧</div>
                                            <div className="input-field">
                                                <label>Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={registrationData.email}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">📞</div>
                                            <div className="input-field">
                                                <label>Phone Number</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={registrationData.phone}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🏛️</div>
                                            <div className="input-field">
                                                <label>County</label>
                                                <select name="county" value={registrationData.county} onChange={handleRegistrationChange}>
                                                    <option value="">Select County</option>
                                                    <option value="Nairobi">Nairobi</option>
                                                    <option value="Mombasa">Mombasa</option>
                                                    <option value="Kisumu">Kisumu</option>
                                                    <option value="Nakuru">Nakuru</option>
                                                    <option value="Kiambu">Kiambu</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">📍</div>
                                            <div className="input-field">
                                                <label>Constituency</label>
                                                <input
                                                    type="text"
                                                    name="constituency"
                                                    value={registrationData.constituency}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🏢</div>
                                            <div className="input-field">
                                                <label>Polling Station</label>
                                                <input
                                                    type="text"
                                                    name="pollingStation"
                                                    value={registrationData.pollingStation}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🔒</div>
                                            <div className="input-field">
                                                <label>Password</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={registrationData.password}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">✓</div>
                                            <div className="input-field">
                                                <label>Confirm Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={registrationData.confirmPassword}
                                                    onChange={handleRegistrationChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="error-message">
                                            <span>⚠️</span> {error}
                                        </div>
                                    )}

                                    <button type="submit" className="register-submit-btn" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register to Vote'}
                                    </button>

                                    <div className="login-link">
                                        Already have an account? 
                                        <button onClick={() => setShowRegistration(false)}>Login here</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Verification Modal */}
                        {showVerification && verificationData && (
                            <div className="verification-modal">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <span className="modal-icon">✅</span>
                                        <h3>Voter Found</h3>
                                        <button className="close-modal" onClick={() => setShowVerification(false)}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="verification-details">
                                            <p><strong>Name:</strong> {verificationData.fullName}</p>
                                            <p><strong>{loginMethod === 'id' ? 'National ID' : 'Passport'}:</strong> {verificationData.identifier}</p>
                                            <p><strong>County:</strong> {verificationData.county}</p>
                                            <p><strong>Constituency:</strong> {verificationData.constituency}</p>
                                            <p><strong>Polling Station:</strong> {verificationData.pollingStation}</p>
                                            <p><strong>Status:</strong> <span className="status-badge">{verificationData.status}</span></p>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button onClick={() => setShowVerification(false)}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoterLogin;