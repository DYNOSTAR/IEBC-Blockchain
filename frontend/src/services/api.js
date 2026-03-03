import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getElections = () => api.get('/elections');
export const getElection = (id) => api.get(`/elections/${id}`);
export const getCounties = () => api.get('/counties');
export const verifyVoter = (data) => api.post('/voter/verify', data);
export const castVote = (data) => api.post('/votes/cast', data);
export const getResults = (electionId) => api.get(`/results/${electionId}`);

export default api;
