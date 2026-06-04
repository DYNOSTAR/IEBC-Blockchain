import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Presidential candidates are managed through All Candidates
// filtered by the "President of Kenya" position.
const PresidentialCandidates = () => {
    const navigate = useNavigate();
    useEffect(() => { navigate('/super-admin/candidates', { replace: true }); }, [navigate]);
    return null;
};

export default PresidentialCandidates;
