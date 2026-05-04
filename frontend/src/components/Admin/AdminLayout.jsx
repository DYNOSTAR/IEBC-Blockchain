import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/admin-layout.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const adminData = localStorage.getItem('user');
        
        if (!token) {
            navigate('/admin/login');
            return;
        }
        
        if (adminData) {
            setAdmin(JSON.parse(adminData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin/login');
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    if (!admin) {
        return <div className="admin-loading">Loading...</div>;
    }

    return (
        <div className="admin-layout">
            <AdminSidebar collapsed={sidebarCollapsed} />
            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminHeader 
                    admin={admin} 
                    onLogout={handleLogout} 
                    onToggleSidebar={toggleSidebar}
                    sidebarCollapsed={sidebarCollapsed}
                />
                <div className="admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;