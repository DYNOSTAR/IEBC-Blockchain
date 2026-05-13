import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/voter-profile.css';

const VoterProfile = ({ voter, onUpdate }) => {
    const [editMode, setEditMode] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [verificationStatus, setVerificationStatus] = useState({
        hasIdCard: false,
        hasFaceImage: false,
        hasBiometric: false,
        isVerified: false
    });
    
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // Load verification status when voter data changes
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

    // Check if verification is complete
    const isVerificationComplete = () => {
        return verificationStatus.hasIdCard && verificationStatus.hasFaceImage && verificationStatus.hasBiometric;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match');
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
                setMessage('Profile updated successfully!');
                setEditMode(false);
                if (onUpdate) onUpdate();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Failed to update profile');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // ID Card Upload
    const handleIdCardUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('idCardImage', file);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-id-card', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                setMessage('ID Card uploaded and verified successfully!');
                setVerificationStatus(prev => ({ ...prev, hasIdCard: true }));
                if (onUpdate) onUpdate();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('ID Card upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Face Upload
    const handleFaceUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('faceImage', file);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-face', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                setMessage('Face image uploaded and verified successfully!');
                setVerificationStatus(prev => ({ ...prev, hasFaceImage: true }));
                if (onUpdate) onUpdate();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Face upload failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Biometric Verification
    const startBiometric = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-biometric', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setMessage('Biometric verification successful!');
                setVerificationStatus(prev => ({ ...prev, hasBiometric: true }));
                if (onUpdate) onUpdate();
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Biometric verification failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-profile-page">
            {/* Verification Section - Show button to verify */}
            {!isVerificationComplete() && (
                <div className="verification-required-card">
                    <div className="verification-icon">🔐</div>
                    <div className="verification-content">
                        <h3>Verify to Vote</h3>
                        <p>You need to complete identity verification before you can vote.</p>
                        <button className="verify-now-btn" onClick={() => setShowVerification(!showVerification)}>
                            {showVerification ? 'Hide Verification' : 'Start Verification'}
                        </button>
                    </div>
                </div>
            )}

            {/* Verification Modal/Popup */}
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
                                {/* Step 1: ID Card */}
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

                                {/* Step 2: Face Image */}
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

                                {/* Step 3: Biometric */}
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
                            <button className="later-btn" onClick={() => setShowVerification(false)}>Later</button>
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

                {message && <div className="profile-message success">{message}</div>}

                {!editMode ? (
                    // Display Mode - All data from database
                    <div className="profile-display">
                        <div className="profile-avatar">👤</div>
                        <div className="profile-details">
                            <p><strong>Full Name:</strong> {voter?.firstName} {voter?.lastName}</p>
                            <p><strong>National ID:</strong> {voter?.nationalId}</p>
                            <p><strong>Email:</strong> {voter?.email || 'Not set'}</p>
                            <p><strong>Phone:</strong> {voter?.phone || 'Not set'}</p>
                            <p><strong>County:</strong> {voter?.countyName || 'Not set'}</p>
                            <p><strong>Constituency:</strong> {voter?.constituencyName || 'Not set'}</p>
                            <p><strong>Ward:</strong> {voter?.wardName || 'Not set'}</p>
                            <p><strong>Verification Status:</strong> 
                                <span className={isVerificationComplete() ? 'status-verified' : 'status-pending'}>
                                    {isVerificationComplete() ? '✓ Fully Verified' : `${Object.values(verificationStatus).filter(v => v).length}/3 Verified`}
                                </span>
                            </p>
                            <p><strong>Voting Status:</strong> 
                                <span className={voter?.hasVoted ? 'status-voted' : 'status-pending'}>
                                    {voter?.hasVoted ? '✓ Voted' : 'Not Voted Yet'}
                                </span>
                            </p>
                        </div>
                    </div>
                ) : (
                    // Edit Mode - Only email, phone, password
                    <form onSubmit={handleSubmit} className="profile-edit-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Leave blank to keep same" />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
                            <button type="submit" className="save-btn" disabled={loading}>Save Changes</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VoterProfile;