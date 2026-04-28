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

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout:', error);
        } else if (error.response?.status === 429) {
            console.error('Too many requests, please wait');
        } else if (error.response?.status === 404) {
            console.error('API endpoint not found:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    // Voter login
    voterLogin: (identifier, password) => 
        api.post('/auth/voter/login', { 
            nationalId: identifier, 
            password 
        }),
    
    // Admin login
    adminLogin: (email, password) => 
        api.post('/auth/admin/login', { email, password }),
    
    // Verify voter
    verifyVoter: (nationalId) => 
        api.post('/auth/verify-voter', { nationalId }),
    
    // Register new voter
    register: (userData) => 
        api.post('/auth/register', userData),
    
    // Verify OTP
    verifyOtp: (userId, otpCode) => 
        api.post('/auth/verify-otp', { userId, otpCode }),
    
    // Resend OTP
    resendOtp: (userId) => 
        api.post('/auth/resend-otp', { userId }),
    
    // Get counties
    getCounties: () => 
        api.get('/auth/counties'),
    
    // Get constituencies by county
    getConstituencies: (countyId) => 
        api.get(`/auth/constituencies/${countyId}`),
    
    // Get wards by constituency
    getWards: (constituencyId) => 
        api.get(`/auth/wards/${constituencyId}`),
    
    // Get polling stations by ward
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
    
    // Alias for voteAPI compatibility
    getVoteCount: (electionId, positionId, candidateId) => 
        api.get(`/elections/vote-count/${electionId}/${positionId}/${candidateId}`),
    
    verifyVote: (electionId, positionId, voterAddress) => 
        api.get(`/elections/verify-vote/${electionId}/${positionId}/${voterAddress}`),
    
    getBlockchainStatus: (electionId) => 
        api.get(`/elections/blockchain-status/${electionId}`),
};

// Alias for voteAPI (to fix the import error)
export const voteAPI = electionAPI;

export const adminAPI = {
    getCounties: () => 
        api.get('/admin/counties'),
    
    addCounty: (countyData) => 
        api.post('/admin/counties', countyData),
    
    getConstituencies: () => 
        api.get('/admin/constituencies'),
    
    addConstituency: (constituencyData) => 
        api.post('/admin/constituencies', constituencyData),
    
    getWards: () => 
        api.get('/admin/wards'),
    
    addWard: (wardData) => 
        api.post('/admin/wards', wardData),
    
    getPollingStations: () => 
        api.get('/admin/polling-stations'),
    
    addPollingStation: (stationData) => 
        api.post('/admin/polling-stations', stationData),
    
    getParties: () => 
        api.get('/admin/parties'),
    
    addParty: (partyData) => 
        api.post('/admin/parties', partyData),
    
    getCandidates: () => 
        api.get('/admin/candidates'),
    
    addCandidate: (candidateData) => 
        api.post('/admin/candidates', candidateData),
    
    getElections: () => 
        api.get('/admin/elections'),
    
    addElection: (electionData) => 
        api.post('/admin/elections', electionData),
    
    getVoters: () => 
        api.get('/admin/voters'),
    
    activateElection: (electionId) => 
        api.put(`/admin/elections/${electionId}/activate`),
    
    deactivateElection: (electionId) => 
        api.put(`/admin/elections/${electionId}/deactivate`),
};

// Also export as default for convenience
export default api;