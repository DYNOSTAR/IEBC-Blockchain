const express = require('express');
const router = express.Router();
const {
    getAllElections,
    getActiveElection,
    getElectionById,
    createElection,
    updateElectionStatus,
    getElectionResults,
    getPositions,
    addCandidate
} = require('../controllers/electionController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ── Public / Voter routes ──────────────────────────────────────
router.get('/active',        authenticate, getActiveElection);
router.get('/results/:id',   getElectionResults);   // public
router.get('/:id/positions', authenticate, getPositions);
router.get('/:id',           authenticate, getElectionById);

// ── Admin-only routes ─────────────────────────────────────────
router.get('/',                                              authenticate, isAdmin, getAllElections);
router.post('/',                                             authenticate, isAdmin, createElection);
router.patch('/:id/status',                                  authenticate, isAdmin, updateElectionStatus);
router.post('/:electionId/positions/:positionId/candidates', authenticate, isAdmin, addCandidate);

module.exports = router;