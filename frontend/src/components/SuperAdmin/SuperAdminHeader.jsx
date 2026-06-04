import React from 'react';
import { useNavigate } from 'react-router-dom';
import iebcLogo from '../../assets/logo.png';
import govLogo  from '../../assets/government-logo.png';

const SuperAdminHeader = ({ admin, onLogout, onToggleSidebar, sidebarCollapsed }) => {
    const navigate = useNavigate();

    const initials = admin
        ? `${admin.first_name?.[0] ?? ''}${admin.last_name?.[0] ?? ''}`.toUpperCase() || 'SA'
        : 'SA';

    const fullName = admin
        ? (admin.name || `${admin.first_name ?? ''} ${admin.last_name ?? ''}`.trim()) || 'Super Admin'
        : 'Super Admin';

    return (
        <header className="sa-header">
            <div className="sa-header-left">
                <button className="sa-toggle-btn" onClick={onToggleSidebar} title="Toggle sidebar">
                    {sidebarCollapsed ? '☰' : '←'}
                </button>

                <div className="sa-header-brand" onClick={() => navigate('/super-admin/dashboard')}>
                    <img src={iebcLogo} alt="IEBC"              className="sa-header-logo" />
                    <img src={govLogo}  alt="Government of Kenya" className="sa-header-gov-logo" />
                </div>

                <div className="sa-header-sep" />

                <div className="sa-header-title">
                    <h1>Super Admin Portal</h1>
                    <p>IEBC Kenya · Full Access</p>
                </div>
            </div>

            <div className="sa-header-right">
                <div className="sa-user-pill">
                    <div className="sa-user-avatar">{initials}</div>
                    <div>
                        <div className="sa-user-name">{fullName}</div>
                        <div className="sa-user-role">Super Admin</div>
                    </div>
                </div>

                <button className="sa-logout-btn" onClick={onLogout}>
                    ⏻ Logout
                </button>
            </div>
        </header>
    );
};

export default SuperAdminHeader;
