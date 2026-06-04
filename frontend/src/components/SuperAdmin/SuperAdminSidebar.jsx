import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import iebcLogo from '../../assets/logo.png';
import '../../styles/super-admin.css';

// Groups with optional count/badge on the right
const NAV_GROUPS = [
    {
        label: 'Overview',
        items: [
            { path: '/super-admin/dashboard',  icon: '⌂', label: 'Dashboard' },
            { path: '/super-admin/statistics', icon: '↗', label: 'Statistics' },
        ]
    },
    {
        label: 'Elections',
        items: [
            { path: '/super-admin/election-management', icon: '◈', label: 'Elections' },
            { path: '/super-admin/results',             icon: '◉', label: 'Live Results', live: true },
        ]
    },
    {
        label: 'Geography',
        items: [
            { path: '/super-admin/counties', icon: '▦', label: 'Counties', count: '47' },
        ]
    },
    {
        label: 'People',
        items: [
            { path: '/super-admin/admins',                  icon: '⊙', label: 'Admins' },
            { path: '/super-admin/voters',                  icon: '◯', label: 'Voters' },
            { path: '/super-admin/candidates',              icon: '◈', label: 'Candidates' },
            { path: '/super-admin/presidential-candidates', icon: '★', label: 'Presidential' },
            { path: '/super-admin/parties',                 icon: '◑', label: 'Parties' },
        ]
    },
    {
        label: 'System',
        items: [
            { path: '/super-admin/audit-logs', icon: '≡', label: 'Audit Logs' },
        ]
    }
];

const SuperAdminSidebar = ({ collapsed }) => {
    const navigate     = useNavigate();
    const { pathname } = useLocation();

    return (
        <div className={`sa-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sa-flag-stripe" />

            {/* Logo */}
            <div className="sa-logo">
                <img src={iebcLogo} alt="IEBC" className="sa-logo-img" />
                <div className="sa-logo-text">
                    <span className="sa-logo-title">Super Admin</span>
                    <span className="sa-logo-badge">IEBC Kenya</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sa-nav">
                {NAV_GROUPS.map((group, gi) => (
                    <div key={gi} className="sa-group">
                        {gi > 0 && <div className="sa-group-divider" />}
                        <div className="sa-group-label">{group.label}</div>
                        {group.items.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`sa-item ${pathname === item.path || pathname.startsWith(item.path + '/') ? 'active' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="sa-item-icon" style={{ fontStyle: 'normal', fontFamily: 'system-ui' }}>
                                    {item.icon}
                                </span>
                                <span className="sa-item-label">{item.label}</span>
                                <span className="sa-item-right">
                                    {item.count && <span className="sa-count-badge">{item.count}</span>}
                                    {item.live  && <span className="sa-live-badge">LIVE</span>}
                                </span>
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="sa-sidebar-footer">
                <div className="sa-footer-row">
                    <div className="sa-status-dot" />
                    <span className="sa-footer-label">System Online</span>
                </div>
                <div className="sa-footer-sub">Full system control · IEBC Kenya</div>
            </div>
        </div>
    );
};

export default SuperAdminSidebar;
