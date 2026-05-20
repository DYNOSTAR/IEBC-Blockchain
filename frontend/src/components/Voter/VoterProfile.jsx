import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/voter-profile.css';

const VoterProfile = ({ voter, onUpdate }) => {
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const [verificationStatus, setVerificationStatus] = useState({
        hasIdCard: false,
        hasFaceImage: false,
        hasBiometric: false,
        isVerified: false,
        level: 0
    });

    useEffect(() => {
        if (voter) {
            setFormData({
                email: voter.email || '',
                phone: voter.phone || '',
                password: '',
                confirmPassword: ''
            });
            setVerificationStatus({
                hasIdCard:   !!voter.idCardPath,
                hasFaceImage: !!voter.faceImagePath,
                hasBiometric: voter.biometricVerified || false,
                isVerified:   voter.isVerified || false,
                level:        voter.verificationLevel || 0
            });
        }
    }, [voter]);

    const completedSteps = () => {
        let n = 0;
        if (verificationStatus.hasIdCard)    n++;
        if (verificationStatus.hasFaceImage) n++;
        if (verificationStatus.hasBiometric) n++;
        return n;
    };

    const isFullyVerified = () => verificationStatus.isVerified || verificationStatus.level >= 4;

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => { setMessage(''); setMessageType(''); }, 3500);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            showMessage('Passwords do not match', 'error'); return;
        }
        if (formData.password && formData.password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error'); return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:5000/api/voter/update-profile', {
                email: formData.email,
                phone: formData.phone,
                password: formData.password || undefined
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (response.data.success) {
                showMessage('Profile updated successfully!', 'success');
                setEditMode(false);
                if (onUpdate) onUpdate();
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                showMessage(response.data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showMessage('Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const verificationLevelLabel = () => {
        if (verificationStatus.level >= 4) return '✓ Fully Verified';
        if (verificationStatus.level === 3) return `${completedSteps()}/3 steps (biometric pending)`;
        if (verificationStatus.level === 2) return `${completedSteps()}/3 steps (face + biometric pending)`;
        if (verificationStatus.level === 1) return 'OTP done — ID card pending';
        return 'Not started';
    };

    return (
        <div className="voter-profile-page">
            {/* Verification Required Banner */}
            {!isFullyVerified() && (
                <div className="verification-required-card">
                    <div className="verification-icon">🔐</div>
                    <div className="verification-content">
                        <h3>Complete Verification to Vote</h3>
                        <p>You have completed {completedSteps()} of 3 verification steps.</p>
                        <button className="verify-now-btn" onClick={() => navigate('/portal/verify')}>
                            {verificationStatus.level === 0 ? 'Start Verification' : 'Continue Verification'}
                        </button>
                    </div>
                </div>
            )}

            <div className="profile-container">
                <div className="profile-header">
                    <h2>My Profile</h2>
                    {!editMode && (
                        <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                            ✏️ Edit Contact Info
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`profile-message ${messageType === 'error' ? 'error' : 'success'}`}>
                        {messageType === 'error' ? '⚠️' : '✅'} {message}
                    </div>
                )}

                {!editMode ? (
                    <div className="profile-display">
                        <div className="profile-avatar">👤</div>
                        <div className="profile-details">
                            <div className="detail-row">
                                <span className="detail-label">Full Name:</span>
                                <span className="detail-value">{voter?.firstName} {voter?.lastName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">National ID:</span>
                                <span className="detail-value">{voter?.nationalId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{voter?.email || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{voter?.phone || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">County:</span>
                                <span className="detail-value">{voter?.countyName || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Constituency:</span>
                                <span className="detail-value">{voter?.constituencyName || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Ward:</span>
                                <span className="detail-value">{voter?.wardName || 'Not set'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Verification:</span>
                                <span className={`detail-value ${isFullyVerified() ? 'status-verified' : 'status-pending'}`}>
                                    {verificationLevelLabel()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Voting Status:</span>
                                <span className={`detail-value ${voter?.hasVoted ? 'status-voted' : 'status-pending'}`}>
                                    {voter?.hasVoted ? '✓ Voted' : 'Not Voted Yet'}
                                </span>
                            </div>

                            {/* Uploaded document thumbnails */}
                            {(verificationStatus.hasIdCard || verificationStatus.hasFaceImage) && (
                                <div className="detail-row verification-images">
                                    <span className="detail-label">Documents:</span>
                                    <div className="doc-thumbnails">
                                        {verificationStatus.hasIdCard && (
                                            <div className="doc-thumb">
                                                <img
                                                    src={`http://localhost:5000${voter.idCardPath}`}
                                                    alt="ID Card"
                                                    title="National ID Card"
                                                />
                                                <small>ID Card ✓</small>
                                            </div>
                                        )}
                                        {verificationStatus.hasFaceImage && (
                                            <div className="doc-thumb">
                                                <img
                                                    src={`http://localhost:5000${voter.faceImagePath}`}
                                                    alt="Face Photo"
                                                    title="Face Photo"
                                                />
                                                <small>Face ✓</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="profile-edit-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0712345678"
                            />
                        </div>
                        <div className="form-divider"></div>
                        <div className="form-group">
                            <label>New Password <small>(leave blank to keep current)</small></label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={() => {
                                setEditMode(false);
                                setFormData({
                                    email: voter?.email || '',
                                    phone: voter?.phone || '',
                                    password: '',
                                    confirmPassword: ''
                                });
                            }}>Cancel</button>
                            <button type="submit" className="save-btn" disabled={loading}>
                                {loading ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VoterProfile;
