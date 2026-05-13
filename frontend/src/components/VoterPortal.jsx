import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VoterPortalHeader from './VoterPortalHeader';
import VerticalSidebar from './VerticalSidebar';
import CivicEducation from './CivicEducation';
import ReportCase from './ReportCase';
import VotingComponent from './VotingComponent';
import VoterProfile from './Voter/VoterProfile';
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
            loadVoterDetails(parsedUser.id);
        }
    }, [navigate]);

    const loadVoterDetails = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/voter/details/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setVoter(response.data.voter);
            }
        } catch (error) {
            console.error('Error loading voter details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleProfileUpdate = () => {
        // Reload voter details after profile update
        if (user?.id) {
            loadVoterDetails(user.id);
        }
    };

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
                        <Route path="/" element={<VoterProfile voter={voter} onUpdate={handleProfileUpdate} />} />
                        <Route path="/profile" element={<VoterProfile voter={voter} onUpdate={handleProfileUpdate} />} />
                        <Route path="/education" element={<CivicEducation />} />
                        <Route path="/voting" element={<VotingComponent voter={voter} />} />
                        <Route path="/update-profile" element={<VoterProfile voter={voter} onUpdate={handleProfileUpdate} />} />
                        <Route path="/report" element={<ReportCase />} />
                        <Route path="/results" element={<ResultsPage />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default VoterPortal;