import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Constituencies and wards are managed through the Counties drill-down page
const SuperAdminConstituencies = () => {
    const navigate = useNavigate();
    useEffect(() => { navigate('/super-admin/counties', { replace: true }); }, [navigate]);
    return null;
};

export default SuperAdminConstituencies;
