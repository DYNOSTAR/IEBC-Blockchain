import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/main.css';
import '../styles/voter-login.css';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [loginMethod, setLoginMethod] = useState('id');
    const [formData, setFormData] = useState({
        nationalId: '',
        passportNumber: '',
        password: ''
    });
    const [showRegistration, setShowRegistration] = useState(false);
    const [registrationData, setRegistrationData] = useState({
        firstName: '', lastName: '', nationalId: '', passportNumber: '',
        email: '', phone: '', county: '', constituency: '',
        pollingStation: '', password: '', confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [verificationData, setVerificationData] = useState(null);

    // OTP state — Step 2 verification after registration
    const [showOtp, setShowOtp] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [registeredUserId, setRegisteredUserId] = useState(null);

    // Eligibility state — Step 3 after login
    const [showEligibility, setShowEligibility] = useState(false);
    const [eligibilityData, setEligibilityData] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRegistrationChange = (e) => {
        setRegistrationData({ ...registrationData, [e.target.name]: e.target.value });
        setError('');
    };

    // ── LOGIN ─────────────────────────────────────────────────
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

        if (!formData.password) {
            setError('Please enter your password.');
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.voterLogin(identifier.trim(), formData.password);

            if (response.data.success) {
                const { token, voter } = response.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(voter));
                localStorage.setItem('role', 'voter');

                // Step 3 eligibility check — has voter already voted?
                if (voter.hasVoted) {
                    setEligibilityData({
                        name: `${voter.firstName} ${voter.lastName}`,
                        nationalId: voter.nationalId,
                        county: voter.countyName,
                        message: 'You have already cast your votes in this election.'
                    });
                    setShowEligibility(true);
                } else {
                    // Go to declaration page before ballot
                    navigate('/declaration');
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // ── REGISTRATION ──────────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();

        if (registrationData.password !== registrationData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (registrationData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!registrationData.nationalId) {
            setError('National ID is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Step 1: verify National ID exists in the register
            const verifyRes = await authAPI.verifyVoter(registrationData.nationalId.trim());
            if (!verifyRes.data.success) {
                setError('National ID not found in the voters register. Please contact IEBC.');
                setLoading(false);
                return;
            }

            // Submit registration
            const response = await authAPI.register({
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                nationalId: registrationData.nationalId,
                email: registrationData.email,
                phone: registrationData.phone,
                county: registrationData.county,
                constituency: registrationData.constituency,
                pollingStation: registrationData.pollingStation,
                password: registrationData.password
            });

            if (response.data.success) {
                setRegisteredUserId(response.data.userId);
                setShowRegistration(false);
                // Step 2: show OTP screen
                setShowOtp(true);
                setError('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── OTP VERIFICATION ──────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) {
            setOtpError('Please enter the 6-digit code sent to your phone/email.');
            return;
        }
        setOtpLoading(true);
        setOtpError('');

        try {
            const response = await authAPI.verifyOtp(registeredUserId, otpCode.trim());
            if (response.data.success) {
                setShowOtp(false);
                setOtpCode('');
                setRegistrationData({
                    firstName: '', lastName: '', nationalId: '', passportNumber: '',
                    email: '', phone: '', county: '', constituency: '',
                    pollingStation: '', password: '', confirmPassword: ''
                });
                alert('Account verified successfully! You can now login.');
            }
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Invalid or expired code. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!registeredUserId) return;
        setOtpLoading(true);
        try {
            await authAPI.resendOtp(registeredUserId);
            setOtpError('');
            alert('A new code has been sent to your phone/email.');
        } catch {
            setOtpError('Failed to resend code. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    // ── VERIFY REGISTRATION STATUS ────────────────────────────
    const handleVerifyRegistration = async () => {
        const identifier = loginMethod === 'id' ? formData.nationalId : formData.passportNumber;
        if (!identifier) {
            setError(`Please enter your ${loginMethod === 'id' ? 'National ID' : 'Passport Number'} first.`);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await authAPI.verifyVoter(identifier.trim());
            if (response.data.success) {
                const v = response.data.voter;
                setVerificationData({
                    fullName: v.fullName,
                    identifier: v.nationalId,
                    county: v.county,
                    constituency: v.ward || 'N/A',
                    pollingStation: v.pollingStation,
                    status: 'Registered'
                });
                setShowVerification(true);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Voter not found. Please register first or contact IEBC.');
            } else {
                setError('Verification failed. Please try again.');
            }
            setVerificationData(null);
        } finally {
            setLoading(false);
        }
    };

    // ── NAVIGATE TO REGISTRATION PAGE (FIXED) ─────────────────
    const goToRegistrationPage = () => {
        navigate('/register');
    };

    // ─────────────────────────────────────────────────────────
    return (
        <div className="voter-login-page">

            {/* Animated Background */}
            <div className="login-bg-animation">
                <div className="bg-shape shape-1"></div>
                <div className="bg-shape shape-2"></div>
                <div className="bg-shape shape-3"></div>
            </div>

            {/* Header Bar */}
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

            <div className="login-main">
                <div className="container">
                    <div className="login-wrapper">

                        {/* OTP Verification Screen */}
                        {showOtp ? (
                            <div className="login-card-enhanced">
                                <div className="card-header">
                                    <div className="card-icon">📱</div>
                                    <h1>Verify Your Account</h1>
                                    <p>Enter the 6-digit code sent to your phone or email</p>
                                </div>
                                <form onSubmit={handleVerifyOtp} className="login-form-enhanced">
                                    <div className="input-group">
                                        <div className="input-icon">🔢</div>
                                        <div className="input-field">
                                            <label>Verification Code</label>
                                            <input
                                                type="text"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="e.g. 123456"
                                                maxLength={6}
                                                required
                                                style={{ letterSpacing: '0.3em', fontSize: '1.3rem', textAlign: 'center' }}
                                            />
                                        </div>
                                    </div>
                                    {otpError && (
                                        <div className="error-message"><span>⚠️</span> {otpError}</div>
                                    )}
                                    <button type="submit" className="login-btn-enhanced" disabled={otpLoading}>
                                        {otpLoading ? 'Verifying...' : 'Verify Account'}
                                    </button>
                                    <div className="forgot-password">
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleResendOtp(); }}>
                                            Resend code
                                        </a>
                                    </div>
                                </form>
                                <div className="login-footer-note">
                                    <p>Code expires in 10 minutes. Check your SMS or email.</p>
                                </div>
                            </div>

                        ) : !showRegistration ? (
                            <>
                                {/* Login Card */}
                                <div className="login-card-enhanced">
                                    <div className="card-header">
                                        <div className="card-icon">🗳️</div>
                                        <h1>Voter Login</h1>
                                        <p>Access your voting dashboard</p>
                                    </div>

                                    <div className="login-method-toggle">
                                        <button
                                            className={`method-btn ${loginMethod === 'id' ? 'active' : ''}`}
                                            onClick={() => setLoginMethod('id')}
                                            type="button"
                                        >
                                            <span>🆔</span> National ID
                                        </button>
                                        <button
                                            className={`method-btn ${loginMethod === 'passport' ? 'active' : ''}`}
                                            onClick={() => setLoginMethod('passport')}
                                            type="button"
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

                                    <div className="divider"><span>or</span></div>

                                    <div className="alternative-actions">
                                        <button
                                            onClick={handleVerifyRegistration}
                                            className="verify-btn-enhanced"
                                            type="button"
                                            disabled={loading}
                                        >
                                            {loading ? 'Checking...' : 'Verify Registration Status'}
                                        </button>
                                        <button
                                            onClick={goToRegistrationPage}
                                            className="register-btn-enhanced"
                                            type="button"
                                        >
                                            Create New Account
                                        </button>
                                    </div>

                                    <div className="login-footer-note">
                                        <p>Need help? Contact IEBC helpline: 0700-111-111</p>
                                        <p className="demo-note">
                                            Test: ID 12345678 &nbsp;|&nbsp; Password: Voter@2027
                                        </p>
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
                            /* Registration Card (Modal version - keeping for backward compatibility) */
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
                                                <input type="text" name="firstName" value={registrationData.firstName} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">👤</div>
                                            <div className="input-field">
                                                <label>Last Name</label>
                                                <input type="text" name="lastName" value={registrationData.lastName} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🆔</div>
                                            <div className="input-field">
                                                <label>National ID</label>
                                                <input type="text" name="nationalId" value={registrationData.nationalId} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">📘</div>
                                            <div className="input-field">
                                                <label>Passport Number (Optional)</label>
                                                <input type="text" name="passportNumber" value={registrationData.passportNumber} onChange={handleRegistrationChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">📧</div>
                                            <div className="input-field">
                                                <label>Email</label>
                                                <input type="email" name="email" value={registrationData.email} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">📞</div>
                                            <div className="input-field">
                                                <label>Phone Number</label>
                                                <input type="tel" name="phone" value={registrationData.phone} onChange={handleRegistrationChange} placeholder="+254..." required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🏛️</div>
                                            <div className="input-field">
                                                <label>County</label>
                                                <select name="county" value={registrationData.county} onChange={handleRegistrationChange} required>
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
                                                <input type="text" name="constituency" value={registrationData.constituency} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🏢</div>
                                            <div className="input-field">
                                                <label>Polling Station</label>
                                                <input type="text" name="pollingStation" value={registrationData.pollingStation} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="input-group">
                                            <div className="input-icon">🔒</div>
                                            <div className="input-field">
                                                <label>Password</label>
                                                <input type="password" name="password" value={registrationData.password} onChange={handleRegistrationChange} placeholder="Min. 8 characters" required />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">✓</div>
                                            <div className="input-field">
                                                <label>Confirm Password</label>
                                                <input type="password" name="confirmPassword" value={registrationData.confirmPassword} onChange={handleRegistrationChange} required />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="error-message"><span>⚠️</span> {error}</div>
                                    )}

                                    <button type="submit" className="register-submit-btn" disabled={loading}>
                                        {loading ? 'Verifying & Registering...' : 'Register to Vote'}
                                    </button>

                                    <div className="login-link">
                                        Already have an account?
                                        <button type="button" onClick={() => { setShowRegistration(false); setError(''); }}>
                                            Login here
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Already Voted Modal */}
                        {showEligibility && eligibilityData && (
                            <div className="verification-modal">
                                <div className="modal-content">
                                    <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                        <span className="modal-icon">⚠️</span>
                                        <h3>Voting Not Available</h3>
                                        <button className="close-modal" onClick={() => { setShowEligibility(false); navigate('/'); }}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="verification-details">
                                            <p><strong>Name:</strong> {eligibilityData.name}</p>
                                            <p><strong>National ID:</strong> {eligibilityData.nationalId}</p>
                                            <p><strong>County:</strong> {eligibilityData.county}</p>
                                            <p style={{ color: '#d97706' }}>{eligibilityData.message}</p>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button onClick={() => navigate('/results')}>View Results</button>
                                    </div>
                                </div>
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