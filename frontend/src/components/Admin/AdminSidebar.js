import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/admin-sidebar.css';

const AdminSidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/profile', icon: '👤', label: 'My Profile' },
        { path: '/admin/counties', icon: '🗺️', label: 'Counties (47)' },
        { path: '/admin/constituencies', icon: '📍', label: 'Constituencies (290)' },
        { path: '/admin/wards', icon: '🏘️', label: 'Wards' },
        { path: '/admin/polling-stations', icon: '🏢', label: 'Polling Stations' },
        { path: '/admin/parties', icon: '🎭', label: 'Political Parties' },
        { path: '/admin/candidates', icon: '👥', label: 'Candidates' },
        { path: '/admin/elections', icon: '📅', label: 'Elections' },
        { path: '/admin/results',   icon: '📊', label: 'Results' },
        { path: '/admin/voters', icon: '👤', label: 'Voters Data' },
        { path: '/admin/reports', icon: '⚠️', label: 'Reports' },
        { path: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' }
    ];

    return (
        <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <div className="logo-icon">🗳️</div>
                {!collapsed && (
                    <div className="logo-text">
                        <span className="logo-title">IEBC</span>
                        <span className="logo-subtitle">Admin Portal</span>
                    </div>
                )}
            </div>
            
            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        {!collapsed && <span className="menu-label">{item.label}</span>}
                        {location.pathname === item.path && <span className="menu-indicator"></span>}
                    </button>
                ))}
            </nav>
            
            {!collapsed && (
                <div className="sidebar-footer">
                    <div className="system-status">
                        <span className="status-dot"></span>
                        System Online
                    </div>
                    <div className="election-year">Election 2027</div>
                </div>
            )}
        </div>
    );
};

export default AdminSidebar;