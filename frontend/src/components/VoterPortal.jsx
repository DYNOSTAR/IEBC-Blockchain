import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import VoterPortalHeader from './VoterPortalHeader';
import VerticalSidebar from './VerticalSidebar';
import CivicEducation from './CivicEducation';
import ReportCase from './ReportCase';
import VotingBooth from './Voter/VotingBooth';
import VoterProfile from './Voter/VoterProfile';
import VerificationPage from './Voter/VerificationPage';
import ResultsPage from './ResultsPage';
import '../styles/voter-portal.css';

const VoterPortal = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [voter, setVoter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login');
            return;
        }
        
        fetchVoterData();
    }, [navigate]);

    const fetchVoterData = async () => {
        try {
            const token = localStorage.getItem('token');
            let userId = localStorage.getItem('userId');
            
            if (!userId) {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    userId = parsed.userId || parsed.id;
                    if (userId) localStorage.setItem('userId', userId);
                    setUser(parsed);
                }
            } else {
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
            }
            
            console.log('Fetching voter data for userId:', userId);
            
            if (!userId) {
                setError('User ID not found. Please login again.');
                setLoading(false);
                return;
            }
            
            const response = await axios.get(`http://localhost:5000/api/voter/details/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Voter details response:', response.data);
            
            if (response.data.success) {
                setVoter(response.data.voter);
            } else {
                setError('Failed to load voter data');
            }
        } catch (err) {
            console.error('Error fetching voter:', err);
            setError(err.response?.data?.error || 'Failed to load voter data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const handleProfileUpdate = () => {
        fetchVoterData();
    };

    const getActiveComponent = () => {
        const path = location.pathname;
        if (path.includes('/profile') || path === '/portal') return 'profile';
        if (path.includes('/education')) return 'education';
        if (path.includes('/voting')) return 'voting';
        if (path.includes('/report')) return 'report';
        if (path.includes('/results')) return 'results';
        if (path.includes('/verify')) return 'verify';
        return 'profile';
    };

    const renderComponent = () => {
        switch (getActiveComponent()) {
            case 'profile':
                return <VoterProfile voter={voter} onUpdate={handleProfileUpdate} />;
            case 'education':
                return <CivicEducation />;
            case 'voting':
                return <VotingBooth voter={voter} />;
            case 'report':
                return <ReportCase />;
            case 'results':
                return <ResultsPage />;
            case 'verify':
                return <VerificationPage voter={voter} onComplete={handleProfileUpdate} />;
            default:
                return <VoterProfile voter={voter} onUpdate={handleProfileUpdate} />;
        }
    };

    if (loading) {
        return (
            <div className="portal-loading">
                <div className="spinner"></div>
                <p>Loading your portal...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="portal-error">
                <div className="error-icon">⚠️</div>
                <h2>Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
        );
    }

    return (
        <div className="voter-portal">
            <VoterPortalHeader user={user} onLogout={handleLogout} />
            <div className="portal-main-layout">
                <VerticalSidebar />
                <div className="portal-content-area">
                    {renderComponent()}
                </div>
            </div>
        </div>
    );
};

export default VoterPortal;