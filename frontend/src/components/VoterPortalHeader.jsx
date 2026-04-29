import React from 'react';
import { useNavigate } from 'react-router-dom';
import iebcLogo from '../assets/logo.png';
import governmentLogo from '../assets/government-logo.png';
import '../styles/voter-portal-header.css';

const VoterPortalHeader = ({ user, onLogout }) => {
    const navigate = useNavigate();

    return (
        <header className="portal-header">
            <div className="portal-header-container">
                <div className="portal-logos">
                    <div className="logo-item" onClick={() => navigate('/portal')}>
                        <img src={iebcLogo} alt="IEBC Kenya Logo" className="portal-logo-img" />
                        <span className="logo-label">IEBC</span>
                    </div>
                    <div className="logo-divider"></div>
                    <div className="logo-item">
                        <img src={governmentLogo} alt="Government of Kenya Logo" className="portal-logo-img" />
                        <span className="logo-label">Government of Kenya</span>
                    </div>
                </div>

                <div className="portal-user-section">
                    <div className="portal-user-info">
                        <span className="portal-user-icon">👤</span>
                        <div className="portal-user-details">
                            <span className="portal-user-name">{user?.firstName} {user?.lastName}</span>
                            <span className="portal-user-id">ID: {user?.nationalId}</span>
                        </div>
                    </div>
                    <button onClick={onLogout} className="portal-logout-btn">
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default VoterPortalHeader;