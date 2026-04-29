import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/vertical-sidebar.css';

const VerticalSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/portal/profile', icon: '👤', label: 'My Profile', color: '#00A651' },
        { path: '/portal/education', icon: '📚', label: 'Civic Education', color: '#00A651' },
        { path: '/portal/voting', icon: '🗳️', label: 'Voting Booth', color: '#00A651' },
        { path: '/portal/update-profile', icon: '✏️', label: 'Update Profile', color: '#00A651' },
        { path: '/portal/report', icon: '⚠️', label: 'Report Case', color: '#C8102E' },
        { path: '/portal/results', icon: '📊', label: 'Results', color: '#00A651' }
    ];

    const handleNavClick = (path) => {
        navigate(path);
    };

    return (
        <div className="vertical-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-welcome">Welcome Back!</div>
                <div className="sidebar-tagline">Your Voice, Your Future</div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavClick(item.path)}
                        className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        style={{ '--hover-color': item.color }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-indicator"></span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-election">Election 2027</div>
                <div className="sidebar-secure">🔒 Blockchain Secured</div>
            </div>
        </div>
    );
};

export default VerticalSidebar;