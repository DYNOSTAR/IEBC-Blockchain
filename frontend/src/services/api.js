import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    voterLogin: (nationalId, password) => 
        api.post('/auth/voter/login', { nationalId, password }),
    
    adminLogin: (email, password) => 
        api.post('/auth/admin/login', { email, password }),
    
    verifyVoter: (nationalId) => 
        api.post('/auth/verify-voter', { nationalId }),
    
    register: (userData) => 
        api.post('/auth/register', userData),
    
    verifyOtp: (userId, otpCode) => 
        api.post('/auth/verify-otp', { userId, otpCode }),
    
    resendOtp: (userId) => 
        api.post('/auth/resend-otp', { userId }),
    
    getCounties: () => 
        api.get('/auth/counties'),
    
    getConstituencies: (countyId) => 
        api.get(`/auth/constituencies/${countyId}`),
    
    getWards: (constituencyId) => 
        api.get(`/auth/wards/${constituencyId}`),
    
    getPollingStations: (wardId) => 
        api.get(`/auth/polling-stations/${wardId}`),
};

export const electionAPI = {
    getActiveElection: () => 
        api.get('/elections/active'),
    
    getPositions: (electionId) => 
        api.get(`/elections/${electionId}/positions`),
    
    castVote: (voteData) => 
        api.post('/elections/cast', voteData),
    
    getResults: (electionId) => 
        api.get(`/elections/results/${electionId}`),
    
    checkCompletion: (electionId) => 
        api.get(`/elections/check-completion/${electionId}`),
    
    getVoteCount: (electionId, positionId, candidateId) => 
        api.get(`/elections/vote-count/${electionId}/${positionId}/${candidateId}`),
    
    verifyVote: (electionId, positionId, voterAddress) => 
        api.get(`/elections/verify-vote/${electionId}/${positionId}/${voterAddress}`),
    
    getBlockchainStatus: (electionId) => 
        api.get(`/elections/blockchain-status/${electionId}`),
};

// This fixes the voteAPI import error
export const voteAPI = electionAPI;

export const adminAPI = {
    getCounties: () => api.get('/admin/counties'),
    addCounty: (data) => api.post('/admin/counties', data),
    getConstituencies: () => api.get('/admin/constituencies'),
    addConstituency: (data) => api.post('/admin/constituencies', data),
    getWards: () => api.get('/admin/wards'),
    addWard: (data) => api.post('/admin/wards', data),
    getPollingStations: () => api.get('/admin/polling-stations'),
    addPollingStation: (data) => api.post('/admin/polling-stations', data),
    getParties: () => api.get('/admin/parties'),
    addParty: (data) => api.post('/admin/parties', data),
    getCandidates: () => api.get('/admin/candidates'),
    addCandidate: (data) => api.post('/admin/candidates', data),
    getElections: () => api.get('/admin/elections'),
    addElection: (data) => api.post('/admin/elections', data),
    getVoters: () => api.get('/admin/voters'),
    activateElection: (id) => api.put(`/admin/elections/${id}/activate`),
    deactivateElection: (id) => api.put(`/admin/elections/${id}/deactivate`),
};

export default api;