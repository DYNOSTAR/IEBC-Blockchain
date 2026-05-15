import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import iebcLogo from '../../assets/logo.png';

const SuperAdminSidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/super-admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/super-admin/admins', icon: '👨‍💼', label: 'Manage Admins' },
        { path: '/super-admin/counties', icon: '🗺️', label: 'Counties (47)', isSuperAdminOnly: true },
        { path: '/super-admin/constituencies', icon: '📍', label: 'Constituencies (290)', isSuperAdminOnly: true },
        { path: '/super-admin/wards', icon: '🏘️', label: 'Wards', isSuperAdminOnly: true },
        { path: '/super-admin/polling-stations', icon: '🏢', label: 'Polling Stations', isSuperAdminOnly: true },
        { path: '/super-admin/parties', icon: '🎭', label: 'Political Parties', isSuperAdminOnly: true },
        { path: '/super-admin/candidates', icon: '👥', label: 'All Candidates', isSuperAdminOnly: true },
        { path: '/super-admin/elections', icon: '📅', label: 'Elections', isSuperAdminOnly: true },
        { path: '/super-admin/voters', icon: '👤', label: 'Voters Data', isSuperAdminOnly: true },
        { path: '/super-admin/reports', icon: '⚠️', label: 'Reports', isSuperAdminOnly: true },
        { path: '/super-admin/audit-logs', icon: '📋', label: 'Audit Logs', isSuperAdminOnly: true }
    ];

    return (
        <div className={`super-admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-logo">
                <img src={iebcLogo} alt="IEBC" className="sidebar-logo-img" />
                {!collapsed && (
                    <div className="logo-text">
                        <span className="logo-title">Super Admin</span>
                        <span className="logo-subtitle">IEBC Kenya</span>
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
                    </button>
                ))}
            </nav>
            
            {!collapsed && (
                <div className="sidebar-footer">
                    <div className="system-status">
                        <span className="status-dot"></span>
                        Super Admin Mode
                    </div>
                    <div className="election-year">Full System Control</div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminSidebar;