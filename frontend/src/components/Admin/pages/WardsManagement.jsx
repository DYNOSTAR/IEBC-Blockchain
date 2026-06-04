import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const WardsManagement = () => { const nav = useNavigate(); useEffect(() => nav('/admin/counties', { replace: true }), [nav]); return null; };
export default WardsManagement;
