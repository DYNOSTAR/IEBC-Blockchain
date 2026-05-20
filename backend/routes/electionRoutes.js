const express = require('express');
const router = express.Router();
const {
    getAllElections, getActiveElection, getElectionById,
    createElection, updateElectionStatus, getPositions, addCandidate
} = require('../controllers/electionController');
const { getElectionResults } = require('../controllers/voteController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/active',        authenticate, getActiveElection);
router.get('/results/:id',   getElectionResults);            // public — real results with winners
router.get('/:id/positions', authenticate, getPositions);
router.get('/:id',           authenticate, getElectionById);

router.get('/',                                              authenticate, isAdmin, getAllElections);
router.post('/',                                             authenticate, isAdmin, createElection);
router.patch('/:id/status',                                  authenticate, isAdmin, updateElectionStatus);
router.post('/:electionId/positions/:positionId/candidates', authenticate, isAdmin, addCandidate);

module.exports = router;