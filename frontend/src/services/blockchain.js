// frontend/src/services/blockchain.js
//
// In this system, blockchain transactions are signed SERVER-SIDE.
// The frontend does NOT need MetaMask or a wallet.
// Votes are submitted to the backend via REST API, and the backend
// signs and broadcasts the transaction to Ganache using the server's
// Ethereum account (SERVER_ETH_ADDRESS in backend .env).
//
// This file provides utility functions for displaying blockchain info
// and verifying votes using the backend API.

import api from './api';

// Verify a vote using its verification code
export const verifyVoteByCode = async (verificationCode) => {
    try {
        const response = await api.post('/votes/verify', { verificationCode });
        return response.data;
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || 'Verification failed'
        };
    }
};

// Get live vote counts for an election
export const getVoteCounts = async (electionId) => {
    try {
        const response = await api.get(`/votes/counts/${electionId}`);
        return response.data;
    } catch (error) {
        return { success: false, results: {} };
    }
};

// Get blockchain status for an election (admin only)
export const getBlockchainStatus = async (electionId) => {
    try {
        const response = await api.get(`/votes/blockchain/${electionId}`);
        return response.data;
    } catch (error) {
        return { success: false, election: null };
    }
};

// Format a transaction hash for display
export const formatTxHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

// Get Ganache explorer-friendly URL (local)
export const getTxUrl = (hash) => {
    return `http://localhost:7545/tx/${hash}`;
};

// Check if a verification code format is valid
export const isValidVerificationCode = (code) => {
    return /^V-[A-Z0-9]{8}$/.test(code);
};