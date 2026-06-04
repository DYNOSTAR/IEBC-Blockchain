import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminHeader from './SuperAdminHeader';
import '../../styles/super-admin.css';

const SuperAdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const adminData = localStorage.getItem('user');
        
        if (!token) {
            navigate('/super-admin/login');
            return;
        }
        
        if (adminData) {
            setAdmin(JSON.parse(adminData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/super-admin/login');
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    if (!admin) {
        return (
            <div className="sa-loading" style={{ minHeight: '100vh', background: '#0f1215', color: '#fff' }}>
                <div className="sa-spin">⛓️</div>
                <p>Loading Super Admin Portal…</p>
            </div>
        );
    }

    return (
        <div className="super-admin-layout">
            <SuperAdminSidebar collapsed={sidebarCollapsed} />
            <div className={`super-admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <SuperAdminHeader 
                    admin={admin} 
                    onLogout={handleLogout} 
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                />
                <div className="super-admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLayout;