import React from 'react';
import '../../styles/admin-header.css';

const AdminHeader = ({ admin, onLogout, onToggleSidebar, sidebarCollapsed }) => {
    return (
        <header className="admin-header">
            <div className="header-left">
                <button className="toggle-sidebar-btn" onClick={onToggleSidebar}>
                    {sidebarCollapsed ? '☰' : '◀'}
                </button>
                <div className="header-title">
                    <h1>Election Management System</h1>
                    <p>IEBC Kenya - Admin Portal</p>
                </div>
            </div>
            
            <div className="header-right">
                <div className="admin-info">
                    <div className="admin-avatar">👨‍💼</div>
                    <div className="admin-details">
                        <span className="admin-name">{admin?.name}</span>
                        <span className="admin-role">Administrator</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    <span>🚪</span> Logout
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;