import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/voter-profile.css';

const VoterProfile = ({ voter, onUpdate }) => {
     const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
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
        isVerified: false
    });

    // Log the voter data to debug
    useEffect(() => {
        console.log('Voter data in profile component:', voter);
    }, [voter]);

    useEffect(() => {
        if (voter) {
            setFormData({
                email: voter.email || '',
                phone: voter.phone || '',
                password: '',
                confirmPassword: ''
            });
            
            setVerificationStatus({
                hasIdCard: !!voter.idCardImage,
                hasFaceImage: !!voter.faceImage,
                hasBiometric: !!voter.biometricData,
                isVerified: voter.isVerified || false
            });
        }
    }, [voter]);

    const isVerificationComplete = () => {
        return verificationStatus.hasIdCard && verificationStatus.hasFaceImage && verificationStatus.hasBiometric;
    };

    const completedSteps = () => {
        let count = 0;
        if (verificationStatus.hasIdCard) count++;
        if (verificationStatus.hasFaceImage) count++;
        if (verificationStatus.hasBiometric) count++;
        return count;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setMessage('');
    };

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (formData.password && formData.password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:5000/api/voter/update-profile', {
                email: formData.email,
                phone: formData.phone,
                password: formData.password || undefined
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                showMessage('Profile updated successfully!', 'success');
                setEditMode(false);
                if (onUpdate) onUpdate();
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: ''
                }));
            } else {
                showMessage(response.data.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showMessage('Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleIdCardUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showMessage('Please upload an image file', 'error');
            return;
        }
        
        const uploadData = new FormData();
        uploadData.append('idCardImage', file);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-id-card', uploadData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                showMessage('ID Card uploaded successfully!', 'success');
                setVerificationStatus(prev => ({ ...prev, hasIdCard: true }));
                if (onUpdate) onUpdate();
            } else {
                showMessage(response.data.error || 'ID Card upload failed', 'error');
            }
        } catch (error) {
            console.error('ID Card upload error:', error);
            showMessage('ID Card upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFaceUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showMessage('Please upload an image file', 'error');
            return;
        }
        
        const uploadData = new FormData();
        uploadData.append('faceImage', file);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-face', uploadData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                showMessage('Face image uploaded successfully!', 'success');
                setVerificationStatus(prev => ({ ...prev, hasFaceImage: true }));
                if (onUpdate) onUpdate();
            } else {
                showMessage(response.data.error || 'Face upload failed', 'error');
            }
        } catch (error) {
            console.error('Face upload error:', error);
            showMessage('Face upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const startBiometric = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-biometric', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                showMessage('Biometric verification successful!', 'success');
                setVerificationStatus(prev => ({ ...prev, hasBiometric: true }));
                if (onUpdate) onUpdate();
            } else {
                showMessage(response.data.error || 'Biometric verification failed', 'error');
            }
        } catch (error) {
            console.error('Biometric error:', error);
            showMessage('Biometric verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-profile-page">
            {/* Verification Required Banner */}
            {!isVerificationComplete() && (
                <div className="verification-required-card">
                    <div className="verification-icon">🔐</div>
                    <div className="verification-content">
                        <h3>Complete Verification to Vote</h3>
                        <p>You have completed {completedSteps()} of 3 verification steps.</p>
                        <button className="verify-now-btn" onClick={() => navigate('/voter/portal/verify')}>
    Start Verification
</button>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerification && (
                <div className="verification-modal-overlay">
                    <div className="verification-modal">
                        <div className="modal-header">
                            <div className="modal-icon">🔐</div>
                            <h3>Identity Verification</h3>
                            <button className="close-modal" onClick={() => setShowVerification(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Complete all steps to verify your identity</p>
                            
                            <div className="verification-steps">
                                <div className={`step ${verificationStatus.hasIdCard ? 'completed' : ''}`}>
                                    <div className="step-number">1</div>
                                    <div className="step-content">
                                        <h4>National ID Card</h4>
                                        <p>Upload a clear photo of your National ID card</p>
                                        {!verificationStatus.hasIdCard ? (
                                            <input type="file" accept="image/*" onChange={handleIdCardUpload} disabled={loading} />
                                        ) : (
                                            <span className="step-verified">✓ Verified</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`step ${verificationStatus.hasFaceImage ? 'completed' : ''}`}>
                                    <div className="step-number">2</div>
                                    <div className="step-content">
                                        <h4>Face Recognition</h4>
                                        <p>Upload a clear photo of your face</p>
                                        {!verificationStatus.hasFaceImage ? (
                                            <input type="file" accept="image/*" onChange={handleFaceUpload} disabled={loading} />
                                        ) : (
                                            <span className="step-verified">✓ Verified</span>
                                        )}
                                    </div>
                                </div>

                                <div className={`step ${verificationStatus.hasBiometric ? 'completed' : ''}`}>
                                    <div className="step-number">3</div>
                                    <div className="step-content">
                                        <h4>Biometric Verification</h4>
                                        <p>Use your fingerprint to verify</p>
                                        {!verificationStatus.hasBiometric ? (
                                            <button onClick={startBiometric} disabled={loading} className="biometric-btn">
                                                {loading ? 'Processing...' : 'Start Biometric Scan'}
                                            </button>
                                        ) : (
                                            <span className="step-verified">✓ Verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="later-btn" onClick={() => setShowVerification(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Container */}
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
                                <span className={`detail-value ${isVerificationComplete() ? 'status-verified' : 'status-pending'}`}>
                                    {isVerificationComplete() ? '✓ Fully Verified' : `${completedSteps()}/3 Verified`}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Voting Status:</span>
                                <span className={`detail-value ${voter?.hasVoted ? 'status-voted' : 'status-pending'}`}>
                                    {voter?.hasVoted ? '✓ Voted' : 'Not Voted Yet'}
                                </span>
                            </div>
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
                            <label>New Password (leave blank to keep current)</label>
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
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VoterProfile;