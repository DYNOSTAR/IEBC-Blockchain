import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader  from './AdminHeader';
import '../../styles/admin.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const data  = localStorage.getItem('user');
        if (!token) { navigate('/admin/login'); return; }
        if (data)   setAdmin(JSON.parse(data));
    }, [navigate]);

    const handleLogout = () => { localStorage.clear(); navigate('/admin/login'); };

    if (!admin) return (
        <div className="adm-loading" style={{ minHeight: '100vh', background: '#F6F7F5' }}>
            <div className="adm-spinner" />
            <span>Loading…</span>
        </div>
    );

    return (
        <div className="adm-layout">
            <AdminSidebar collapsed={collapsed} />
            <div className={`adm-main ${collapsed ? 'expanded' : ''}`}>
                <AdminHeader
                    admin={admin}
                    onLogout={handleLogout}
                    onToggleSidebar={() => setCollapsed(c => !c)}
                    sidebarCollapsed={collapsed}
                />
                <div className="adm-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
