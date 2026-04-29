import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import VoterPortalHeader from './VoterPortalHeader';
import VerticalSidebar from './VerticalSidebar';
import CivicEducation from './CivicEducation';
import ReportCase from './ReportCase';
import VotingComponent from './VotingComponent';
import '../styles/voter-portal.css';

const VoterPortal = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [voter, setVoter] = useState(null);
    const [loading, setLoading] = useState(true);

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
            setVoter(parsedUser);
        }
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const ProfilePage = () => (
        <div className="portal-page-content">
            <h2>👤 My Profile</h2>
            <div className="profile-card">
                <div className="profile-avatar">👤</div>
                <div className="profile-info">
                    <p><strong>Full Name:</strong> {voter?.firstName} {voter?.lastName}</p>
                    <p><strong>National ID:</strong> {voter?.nationalId}</p>
                    <p><strong>Voting Status:</strong> 
                        <span className={voter?.hasVoted ? 'status-voted' : 'status-pending'}>
                            {voter?.hasVoted ? '✓ Voted' : 'Not Voted Yet'}
                        </span>
                    </p>
                    <p><strong>Registration Date:</strong> {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );

    const UpdateProfilePage = () => (
        <div className="portal-page-content">
            <h2>✏️ Update Profile</h2>
            <div className="profile-edit-form">
                <div className="form-group">
                    <label>First Name</label>
                    <input type="text" defaultValue={voter?.firstName} placeholder="Enter first name" />
                </div>
                <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" defaultValue={voter?.lastName} placeholder="Enter last name" />
                </div>
                <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="Enter your phone number" />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="Enter your email address" />
                </div>
                <button className="update-btn">Save Changes</button>
            </div>
        </div>
    );

    const ResultsPage = () => (
        <div className="portal-page-content">
            <h2>📊 Election Results</h2>
            <div className="results-card">
                <div className="results-placeholder">
                    <div className="placeholder-icon">🗳️</div>
                    <p>Live results will appear here after voting begins</p>
                    <button onClick={() => navigate('/results')} className="view-full-results">
                        View Full Results →
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <div className="portal-loading"><div className="spinner"></div><p>Loading your portal...</p></div>;
    }

    return (
        <div className="voter-portal">
            <VoterPortalHeader user={user} onLogout={handleLogout} />
            <div className="portal-main-layout">
                <VerticalSidebar />
                <div className="portal-content-area">
                    <Routes>
                        <Route path="/" element={<ProfilePage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/education" element={<CivicEducation />} />
                        <Route path="/voting" element={<VotingComponent />} />
                        <Route path="/update-profile" element={<UpdateProfilePage />} />
                        <Route path="/report" element={<ReportCase />} />
                        <Route path="/results" element={<ResultsPage />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default VoterPortal;