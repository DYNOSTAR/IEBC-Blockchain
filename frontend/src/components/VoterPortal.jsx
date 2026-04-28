import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VotingComponent from './VotingComponent';
import '../styles/voter-portal.css';

const VoterPortal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);
    const [voter, setVoter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verificationLevel, setVerificationLevel] = useState(0);
    const [showVerification, setShowVerification] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [hasVoted, setHasVoted] = useState(false);
    
    const [civicTopics] = useState([
        { id: 1, title: "Why Your Vote Matters", content: "Your vote is your voice in shaping the future of Kenya...", icon: "🗳️" },
        { id: 2, title: "Understanding the Constitution", content: "The Kenyan Constitution guarantees your right to vote...", icon: "📜" },
        { id: 3, title: "How Blockchain Voting Works", content: "Blockchain technology ensures your vote is secure and verifiable...", icon: "⛓️" },
        { id: 4, title: "Voter Rights and Responsibilities", content: "Know your rights as a voter and your responsibilities...", icon: "⚖️" },
        { id: 5, title: "IEBC Guidelines", content: "Follow these guidelines for a smooth voting experience...", icon: "📋" }
    ]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token) {
            navigate('/login');
            return;
        }
        
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            loadVoterDetails(parsedUser);
        }
        
        loadVerificationStatus();
        checkIfVoted();
    }, [navigate]);

    const loadVoterDetails = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/voter/details/${userData.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVoter(response.data.voter);
            setEditForm(response.data.voter);
        } catch (error) {
            console.error('Error loading voter details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVerificationStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/voter/verification-status', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerificationLevel(response.data.level);
        } catch (error) {
            console.error('Error loading verification status:', error);
        }
    };

    const checkIfVoted = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/voter/has-voted', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasVoted(response.data.hasVoted);
        } catch (error) {
            console.error('Error checking vote status:', error);
        }
    };

    const sendOTP = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/voter/send-otp', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowVerification(true);
            alert('OTP sent to your registered phone number!');
        } catch (error) {
            console.error('Error sending OTP:', error);
            alert('Failed to send OTP');
        }
    };

    const verifyOTP = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-otp', 
                { otpCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setVerificationLevel(1);
                setShowVerification(false);
                setOtpCode('');
                alert('OTP verified successfully!');
            }
        } catch (error) {
            alert('Invalid OTP. Please try again.');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('idImage', file);
        
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/voter/verify-id', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setVerificationLevel(2);
            alert('ID verified successfully!');
        } catch (error) {
            alert('ID verification failed');
        }
    };

    const startFaceRecognition = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/voter/verify-face', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerificationLevel(3);
            alert('Face verification successful!');
        } catch (error) {
            alert('Face verification failed');
        }
    };

    const startBiometric = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/voter/verify-biometric', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVerificationLevel(4);
            alert('Biometric verification successful!');
        } catch (error) {
            alert('Biometric verification failed');
        }
    };

    const updateProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:5000/api/voter/update-profile', editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVoter(editForm);
            setEditMode(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const isFullyVerified = verificationLevel >= 4;
    // const canVote = isFullyVerified && !hasVoted;

    if (loading) {
        return (
            <div className="portal-loading">
                <div className="spinner"></div>
                <p>Loading your portal...</p>
            </div>
        );
    }

    return (
        <div className="voter-portal">
            {/* Sidebar */}
            <div className="portal-sidebar">
                <div className="sidebar-header">
                    <div className="portal-logo">🗳️</div>
                    <h3>Voter Portal</h3>
                    <p>{user?.firstName} {user?.lastName}</p>
                    <div className="verification-badge">
                        {isFullyVerified ? '✅ Fully Verified' : `⚠️ ${verificationLevel}/4 Verified`}
                    </div>
                    {hasVoted && <div className="voted-badge">🗳️ Voted</div>}
                </div>
                
                <nav className="portal-nav">
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                        👤 My Profile
                    </button>
                    <button className={activeTab === 'verify' ? 'active' : ''} onClick={() => setActiveTab('verify')}>
                        🔐 Verification ({verificationLevel}/4)
                    </button>
                    <button className={activeTab === 'education' ? 'active' : ''} onClick={() => setActiveTab('education')}>
                        📚 Civic Education
                    </button>
                    <button className={activeTab === 'voting' ? 'active' : ''} onClick={() => setActiveTab('voting')}>
                        🗳️ Voting Booth
                    </button>
                    <button className={activeTab === 'results' ? 'active' : ''} onClick={() => setActiveTab('results')}>
                        📊 Election Results
                    </button>
                </nav>
                
                <button onClick={handleLogout} className="portal-logout">
                    🚪 Logout
                </button>
            </div>
            
            {/* Main Content */}
            <div className="portal-main">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="portal-tab">
                        <div className="tab-header">
                            <h2>My Profile</h2>
                            {!editMode && (
                                <button onClick={() => setEditMode(true)} className="edit-btn">
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>
                        
                        {editMode ? (
                            <div className="profile-edit-form">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={editForm.firstName || ''}
                                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={editForm.lastName || ''}
                                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone || ''}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                    />
                                </div>
                                <div className="button-group">
                                    <button onClick={updateProfile} className="save-btn">Save Changes</button>
                                    <button onClick={() => setEditMode(false)} className="cancel-btn">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-display">
                                <div className="profile-card">
                                    <div className="profile-avatar">👤</div>
                                    <div className="profile-info">
                                        <p><strong>Name:</strong> {voter?.firstName} {voter?.lastName}</p>
                                        <p><strong>National ID:</strong> {voter?.nationalId}</p>
                                        <p><strong>Email:</strong> {voter?.email}</p>
                                        <p><strong>Phone:</strong> {voter?.phone}</p>
                                        <p><strong>Verification Status:</strong> 
                                            <span className={isFullyVerified ? 'status-verified' : 'status-pending'}>
                                                {isFullyVerified ? 'Fully Verified' : `${verificationLevel}/4 Verified`}
                                            </span>
                                        </p>
                                        {hasVoted && <p><strong>Voting Status:</strong> <span className="status-voted">✓ Voted</span></p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Verification Tab */}
                {activeTab === 'verify' && (
                    <div className="portal-tab">
                        <h2>Multi-Level Verification</h2>
                        <p>Complete all verification levels to access voting</p>
                        
                        <div className="verification-steps">
                            {/* Level 1: OTP */}
                            <div className={`verification-step ${verificationLevel >= 1 ? 'completed' : ''}`}>
                                <div className="step-icon">📱</div>
                                <div className="step-info">
                                    <h3>Level 1: OTP Verification</h3>
                                    <p>Verify your phone number with a one-time password</p>
                                    {verificationLevel < 1 && (
                                        <div className="step-action">
                                            <button onClick={sendOTP}>Send OTP</button>
                                            {showVerification && (
                                                <div className="otp-input">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter OTP"
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value)}
                                                    />
                                                    <button onClick={verifyOTP}>Verify</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {verificationLevel >= 1 && <span className="completed-badge">✅ Completed</span>}
                                </div>
                            </div>
                            
                            {/* Level 2: ID Verification */}
                            <div className={`verification-step ${verificationLevel >= 2 ? 'completed' : ''}`}>
                                <div className="step-icon">🆔</div>
                                <div className="step-info">
                                    <h3>Level 2: ID Verification</h3>
                                    <p>Upload a clear image of your National ID</p>
                                    {verificationLevel < 2 && (
                                        <div className="step-action">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="file-input"
                                            />
                                        </div>
                                    )}
                                    {verificationLevel >= 2 && <span className="completed-badge">✅ Completed</span>}
                                </div>
                            </div>
                            
                            {/* Level 3: Face Recognition */}
                            <div className={`verification-step ${verificationLevel >= 3 ? 'completed' : ''}`}>
                                <div className="step-icon">😀</div>
                                <div className="step-info">
                                    <h3>Level 3: Face Recognition</h3>
                                    <p>Use your camera for facial verification</p>
                                    {verificationLevel < 3 && (
                                        <div className="step-action">
                                            <button onClick={startFaceRecognition}>Start Face Scan</button>
                                        </div>
                                    )}
                                    {verificationLevel >= 3 && <span className="completed-badge">✅ Completed</span>}
                                </div>
                            </div>
                            
                            {/* Level 4: Biometric */}
                            <div className={`verification-step ${verificationLevel >= 4 ? 'completed' : ''}`}>
                                <div className="step-icon">🖐️</div>
                                <div className="step-info">
                                    <h3>Level 4: Biometric Verification</h3>
                                    <p>Use fingerprint scanner for final verification</p>
                                    {verificationLevel < 4 && (
                                        <div className="step-action">
                                            <button onClick={startBiometric}>Scan Fingerprint</button>
                                        </div>
                                    )}
                                    {verificationLevel >= 4 && <span className="completed-badge">✅ Completed</span>}
                                </div>
                            </div>
                        </div>
                        
                        {verificationLevel >= 4 && (
                            <div className="verification-success">
                                <div className="success-icon">🎉</div>
                                <h3>You are fully verified!</h3>
                                <p>You can now access the voting booth</p>
                                <button onClick={() => setActiveTab('voting')} className="vote-btn">
                                    Go to Voting Booth
                                </button>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Civic Education Tab */}
                {activeTab === 'education' && (
                    <div className="portal-tab">
                        <h2>Civic Education</h2>
                        <p>Learn about your rights and the voting process</p>
                        
                        <div className="civic-grid">
                            {civicTopics.map(topic => (
                                <div key={topic.id} className="civic-card">
                                    <div className="civic-icon">{topic.icon}</div>
                                    <h3>{topic.title}</h3>
                                    <p>{topic.content}</p>
                                    <button className="read-more">Read More →</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Voting Booth Tab - Integrated Voting Component */}
                {activeTab === 'voting' && (
                    <div className="portal-tab">
                        {hasVoted ? (
                            <div className="already-voted-card">
                                <div className="already-voted-icon">🗳️</div>
                                <h2>You Have Already Voted</h2>
                                <p>Thank you for participating in the election.</p>
                                <button onClick={() => setActiveTab('results')} className="view-results-btn">
                                    View Results
                                </button>
                            </div>
                        ) : !isFullyVerified ? (
                            <div className="verification-required-card">
                                <div className="warning-icon">⚠️</div>
                                <h3>Verification Required</h3>
                                <p>You need to complete all 4 verification levels before voting</p>
                                <button onClick={() => setActiveTab('verify')} className="verify-now-btn">
                                    Complete Verification Now
                                </button>
                            </div>
                        ) : (
                            <VotingComponent onComplete={() => setHasVoted(true)} />
                        )}
                    </div>
                )}
                
                {/* Results Tab */}
                {activeTab === 'results' && (
                    <div className="portal-tab">
                        <h2>Election Results</h2>
                        <div className="results-summary">
                            <div className="result-card">
                                <h3>Live Results</h3>
                                <p>Results are updated in real-time from the blockchain</p>
                                <button onClick={() => navigate('/results')} className="view-results-btn">
                                    View Full Results →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoterPortal;