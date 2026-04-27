const express = require('express');
const router = express.Router();
const { castVote, verifyVoteByCode, getBlockchainElectionStatus, getVoteCounts } = require('../controllers/voteController');
const { authenticate, isVoter, isAdmin } = require('../middleware/auth');

// Voter: cast a vote
router.post('/cast', authenticate, isVoter, castVote);

// Public: verify a vote using verification code
router.post('/verify', verifyVoteByCode);

// Voter/admin: get live vote counts for an election
router.get('/counts/:electionId', authenticate, getVoteCounts);

// Admin: get blockchain status for an election
router.get('/blockchain/:electionId', authenticate, isAdmin, getBlockchainElectionStatus);

module.exports = router;