import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuperAdminWards = () => {
    const navigate = useNavigate();
    useEffect(() => { navigate('/super-admin/counties', { replace: true }); }, [navigate]);
    return null;
};

export default SuperAdminWards;
