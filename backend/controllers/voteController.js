const Vote = require('../models/vote');
const Election = require('../models/Election');
const Voter = require('../models/Voter');
const { votingContract, web3 } = require('../config/blockchain');

// Cast vote on blockchain
const castBlockchainVote = async (voterAddress, positionId, candidateId, electionId) => {
    try {
        // Call smart contract to record vote
        const tx = await votingContract.methods
            .vote(electionId, positionId, candidateId)
            .send({ from: voterAddress, gas: 200000 });
        
        return tx.transactionHash;
    } catch (error) {
        console.error('Blockchain vote error:', error);
        throw new Error('Failed to record vote on blockchain');
    }
};

// Main voting controller
const castVote = async (req, res) => {
    const { electionId, positionId, candidateId, voterAddress } = req.body;
    const userId = req.user.id; // From JWT authentication

    try {
        // Check if election is active
        const activeElection = await Election.getActiveElection();
        if (!activeElection || activeElection.id !== electionId) {
            return res.status(400).json({ error: 'Election is not active' });
        }

        // Get voter details
        const voter = await Voter.findByUserId(userId);
        if (!voter) {
            return res.status(404).json({ error: 'Voter not found' });
        }

        // Check if already voted for this position
        const alreadyVoted = await Vote.hasVoted(voter.id, electionId, positionId);
        if (alreadyVoted) {
            return res.status(400).json({ error: 'Already voted for this position' });
        }

        // Record vote on blockchain
        const transactionHash = await castBlockchainVote(
            voterAddress,
            positionId,
            candidateId,
            electionId
        );

        // Record vote in local database
        const newVote = await Vote.castVote(
            voter.id,
            electionId,
            positionId,
            candidateId,
            transactionHash
        );

        res.status(201).json({
            success: true,
            message: 'Vote recorded successfully',
            vote: newVote,
            transactionHash
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get election results
const getResults = async (req, res) => {
    const { electionId } = req.params;

    try {
        // Get results from database
        const results = await Election.getResults(parseInt(electionId));
        
        // Optionally verify with blockchain
        const blockchainVerified = await verifyBlockchainResults(electionId);
        
        res.json({
            success: true,
            results,
            blockchainVerified
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify blockchain results
const verifyBlockchainResults = async (electionId) => {
    try {
        const totalVotes = await votingContract.methods.getTotalVotes(electionId).call();
        return { totalVotes: parseInt(totalVotes), verified: true };
    } catch (error) {
        return { verified: false, error: error.message };
    }
};

module.exports = { castVote, getResults, verifyBlockchainResults };