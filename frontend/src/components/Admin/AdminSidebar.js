import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../shared/Icon';
import '../../styles/admin.css';

const GROUPS = [
    {
        label: 'Overview',
        items: [
            { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
            { path: '/admin/profile',   icon: 'profile',   label: 'My Profile' },
        ]
    },
    {
        label: 'Elections',
        items: [
            { path: '/admin/reports', icon: 'election', label: 'Elections' },
            { path: '/admin/results', icon: 'results',  label: 'Live Results', live: true },
        ]
    },
    {
        label: 'Geography',
        items: [
            { path: '/admin/counties',       icon: 'county',       label: 'Counties',       count: '47' },
            { path: '/admin/constituencies', icon: 'constituency', label: 'Constituencies', count: '290' },
            { path: '/admin/wards',          icon: 'ward',         label: 'Wards' },
        ]
    },
    {
        label: 'People',
        items: [
            { path: '/admin/parties',    icon: 'party',      label: 'Political Parties' },
            { path: '/admin/candidates', icon: 'candidates', label: 'Candidates' },
            { path: '/admin/voters',     icon: 'users',      label: 'Voters' },
        ]
    },
    {
        label: 'System',
        items: [
            { path: '/admin/audit-logs', icon: 'logs', label: 'Audit Logs' },
        ]
    }
];

const AdminSidebar = ({ collapsed }) => {
    const navigate     = useNavigate();
    const { pathname } = useLocation();

    return (
        <div className={`adm-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Flag stripe */}
            <div className="flag-stripe" />

            {/* Logo */}
            <div className="adm-sidebar-logo">
                <div className="adm-sidebar-logo-icon">
                    <Icon name="election" size={16} color="#fff" />
                </div>
                <div className="adm-sidebar-logo-text">
                    <span className="adm-sidebar-logo-name">IEBC Admin</span>
                    <span className="adm-sidebar-logo-sub">Admin Portal</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="adm-sidebar-nav">
                {GROUPS.map((group, gi) => (
                    <div key={gi} className="adm-sidebar-group">
                        {gi > 0 && <div className="adm-sidebar-divider" />}
                        <div className="adm-sidebar-group-label">{group.label}</div>
                        {group.items.map(item => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`adm-nav-item ${pathname === item.path ? 'active' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon name={item.icon} size={15} className="adm-nav-icon" />
                                <span className="adm-nav-label">{item.label}</span>
                                {item.count && <span className="adm-nav-count">{item.count}</span>}
                                {item.live  && <span className="adm-nav-live" title="Live" />}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="adm-sidebar-footer">
                <div className="adm-sidebar-status">
                    <div className="adm-sidebar-status-dot" />
                    <span className="adm-sidebar-status-text">System Online</span>
                </div>
                <div className="adm-sidebar-version">IEBC Kenya · Admin Portal</div>
            </div>
        </div>
    );
};

export default AdminSidebar;
