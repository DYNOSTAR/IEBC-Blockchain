import React from 'react';
import Icon from '../shared/Icon';
import '../../styles/admin.css';

const AdminHeader = ({ admin, onLogout, onToggleSidebar, sidebarCollapsed }) => {
    const name = admin?.name
        || `${admin?.first_name ?? ''} ${admin?.last_name ?? ''}`.trim()
        || 'Admin';
    const initials = name.split(' ').map(p => p[0] || '').slice(0, 2).join('').toUpperCase() || 'A';

    return (
        <header className="adm-header">
            <div className="adm-header-left">
                <button className="adm-toggle-btn" onClick={onToggleSidebar} title="Toggle sidebar">
                    <Icon name={sidebarCollapsed ? 'chevron' : 'chevron'} size={14}
                          style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)' }} />
                </button>
                <div className="adm-header-sep" />
                <div>
                    <div className="adm-header-title">Election Management System</div>
                    <div className="adm-header-sub">IEBC Kenya · Admin Portal</div>
                </div>
            </div>

            <div className="adm-header-right">
                <div className="adm-user-chip">
                    <div className="adm-user-avatar">{initials}</div>
                    <div>
                        <div className="adm-user-name">{name}</div>
                        <div className="adm-user-role">{admin?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}</div>
                    </div>
                </div>
                <button className="adm-btn danger" onClick={onLogout}>
                    <Icon name="logout" size={14} />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;
