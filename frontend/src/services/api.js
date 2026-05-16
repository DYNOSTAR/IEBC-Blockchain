import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    voterLogin: (nationalId, password) =>
        api.post('/auth/voter/login', { nationalId, password }),
    adminLogin: (email, password) =>
        api.post('/auth/admin/login', { email, password }),
    verifyVoter: (nationalId) =>
        api.post('/auth/verify-voter', { nationalId }),
    register: (data) =>
        api.post('/auth/register', data),
    verifyOtp: (userId, otpCode) =>
        api.post('/auth/verify-otp', { userId, otpCode }),
    resendOtp: (userId) =>
        api.post('/auth/resend-otp', { userId }),
    declaration: () =>
        api.post('/auth/declaration', { accepted: true }),
    getCurrentUser: () =>
        api.get('/auth/me'),
    logout: () =>
        api.post('/auth/logout')
};

export const electionAPI = {
    getActive: () =>
        api.get('/elections/active'),
    getById: (id) =>
        api.get(`/elections/${id}`),
    getPositions: (electionId) =>
        api.get(`/elections/${electionId}/positions`),
    getResults: (electionId) =>
        api.get(`/elections/results/${electionId}`),
    getAll: () =>
        api.get('/elections'),
    create: (data) =>
        api.post('/elections', data),
    updateStatus: (id, status) =>
        api.patch(`/elections/${id}/status`, { status }),
    addCandidate: (electionId, positionId, data) =>
        api.post(`/elections/${electionId}/positions/${positionId}/candidates`, data)
};

export const voteAPI = {
    cast: (electionId, positionId, candidateId) =>
        api.post('/votes/cast', { electionId, positionId, candidateId }),
    verify: (verificationCode) =>
        api.post('/votes/verify', { verificationCode }),
    getCounts: (electionId) =>
        api.get(`/votes/counts/${electionId}`),
    getBlockchainStatus: (electionId) =>
        api.get(`/votes/blockchain/${electionId}`)
};

export default api;