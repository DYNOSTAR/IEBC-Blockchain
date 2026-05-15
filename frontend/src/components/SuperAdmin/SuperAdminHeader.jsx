import React from 'react';
import { useNavigate } from 'react-router-dom';
import iebcLogo from '../../assets/logo.png';
import governmentLogo from '../../assets/government-logo.png';

const SuperAdminHeader = ({ admin, onLogout, onToggleSidebar, sidebarCollapsed }) => {
    const navigate = useNavigate();

    return (
        <header className="super-admin-header">
            <div className="header-left">
                <button className="toggle-sidebar-btn" onClick={onToggleSidebar}>
                    {sidebarCollapsed ? '☰' : '◀'}
                </button>
                <div className="header-logos">
                    <div className="logo-item" onClick={() => navigate('/super-admin/dashboard')}>
                        <img src={iebcLogo} alt="IEBC Logo" className="header-logo-img" />
                        <span className="logo-label">IEBC</span>
                    </div>
                    <div className="logo-divider"></div>
                    <div className="logo-item">
                        <img src={governmentLogo} alt="Government of Kenya" className="header-logo-img" />
                        <span className="logo-label">Government of Kenya</span>
                    </div>
                </div>
                <div className="header-title">
                    <h1>Super Admin Control Panel</h1>
                    <p>Full System Administration</p>
                </div>
            </div>
            
            <div className="header-right">
                <div className="admin-info">
                    
                    <div className="admin-details">
                        <span className="admin-name">{admin?.name || admin?.first_name + ' ' + admin?.last_name}</span>
                        <span className="admin-role">Super Administrator</span>
                        <span className="admin-id">ID: {admin?.nationalId}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    <span>🚪</span> Logout
                </button>
            </div>
        </header>
    );
};

export default SuperAdminHeader;