import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import '../../styles/header.css';

const Header = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const navItems = [
        { path: '/', label: 'Home' },
    ];
    
    return (
        <header className="kenyan-header">
            <div className="container">
                <div className="header-container">
                    {/* Logo Section */}
                    <div className="logo-section" onClick={() => navigate('/')}>
                        <img src={logo} alt="IEBC Kenya Logo" className="logo-image" />
                        <div className="logo-text">
                            <span className="logo-title">IEBC</span>
                            <span className="logo-subtitle">Kenya</span>
                        </div>
                    </div>
                    
                    {/* Navigation Links */}
                    <nav className="nav-links">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                {item.label}
                                {location.pathname === item.path && <span className="nav-underline"></span>}
                            </button>
                        ))}
                    </nav>
                    
                    {/* User Section */}
                    {user ? (
                        <div className="user-section">
                            <div className="user-info">
                                <span className="user-icon">👤</span>
                                <span className="user-name">{user.firstName || user.name}</span>
                            </div>
                            <button onClick={onLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => navigate('/login')} 
                            className="btn-voter"
                        >
                            <span>🗳️</span> Voter Login
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;