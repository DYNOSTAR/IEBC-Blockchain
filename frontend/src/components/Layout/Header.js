import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/header.css';

const Header = ({ title, subtitle, user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const getPageTitle = () => {
        const path = location.pathname;
        if (title) return title;
        
        switch(path) {
            case '/':
                return 'Welcome to IEBC Blockchain Voting System';
            case '/login':
                return 'Voter Login';
            case '/admin/login':
                return 'Administrator Portal';
            case '/voting':
                return 'Cast Your Vote';
            case '/results':
                return 'Election Results';
            case '/verify':
                return 'Verify Voter Registration';
            case '/admin/dashboard':
                return 'Admin Dashboard';
            default:
                return 'IEBC Blockchain Voting System';
        }
    };
    
    const getPageSubtitle = () => {
        if (subtitle) return subtitle;
        
        switch(location.pathname) {
            case '/':
                return 'Secure • Transparent • Verifiable Elections';
            case '/login':
                return 'Access your voting dashboard';
            case '/admin/login':
                return 'Election Management System';
            case '/voting':
                return 'Your vote, your voice - Secured by blockchain';
            case '/results':
                return 'Live results verified on the blockchain';
            case '/verify':
                return 'Check your voter registration status';
            default:
                return 'Kenya General Election 2027';
        }
    };
    
    return (
        <header className="iebc-header">
            <div className="header-top">
                <div className="container">
                    <div className="header-content">
                        <div className="logo-section" onClick={() => navigate('/')}>
                            <div className="iebc-logo">
                                <img src="/iebc-logo.png" alt="IEBC Logo" className="logo-image" />
                            </div>
                            <div className="iebc-title">
                                <h1>INDEPENDENT ELECTORAL AND BOUNDARIES COMMISSION</h1>
                                <p>Kenya - Blockchain Secured Elections 2027</p>
                            </div>
                        </div>
                        
                        {user && (
                            <div className="user-info">
                                <div className="user-greeting">
                                    <span className="user-icon">👤</span>
                                    <div className="user-details">
                                        <span className="user-name">Welcome, {user.firstName || user.name}</span>
                                        <span className="user-role">{user.role || 'Voter'}</span>
                                    </div>
                                </div>
                                <button onClick={onLogout} className="logout-btn">
                                    <span>🚪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="header-bottom">
                <div className="container">
                    <div className="page-title-section">
                        <h2>{getPageTitle()}</h2>
                        <p>{getPageSubtitle()}</p>
                    </div>
                </div>
            </div>
            
            <div className="blockchain-badge">
                <div className="container">
                    <div className="badge-content">
                        <span className="badge-icon">⛓️</span>
                        <span>Blockchain Secured • Tamper-Proof • Verifiable</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;