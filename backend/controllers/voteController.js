const pool = require('../config/db');
const { castVoteOnBlockchain, verifyVote, getElectionDetails } = require('../config/blockchain');

// Cast vote using blockchain
const castVote = async (req, res) => {
    const { electionId, positionId, candidateId } = req.body;
    const userId = req.user.id;
    const voterAddress = req.user.voterAddress || '0x...'; // You'll store voter addresses

    try {
        // Check if election is active in database
        const electionQuery = `
            SELECT * FROM elections 
            WHERE id = $1 AND status = 'active'
        `;
        const electionResult = await pool.query(electionQuery, [electionId]);
        
        if (electionResult.rows.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Election is not active' 
            });
        }

        // Get voter info
        const voterQuery = `
            SELECT v.id as voter_id, u.national_id 
            FROM voters v
            JOIN users u ON v.user_id = u.id
            WHERE v.user_id = $1
        `;
        const voterResult = await pool.query(voterQuery, [userId]);
        
        if (voterResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Voter not found' 
            });
        }

        const voter = voterResult.rows[0];

        // Check if already voted for this position
        const checkVoteQuery = `
            SELECT * FROM votes 
            WHERE voter_id = $1 AND election_id = $2 AND position_id = $3
        `;
        const existingVote = await pool.query(checkVoteQuery, [voter.voter_id, electionId, positionId]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Already voted for this position' 
            });
        }

        // Cast vote on blockchain
        // Note: In production, you'd get the voter's private key securely
        const voterPrivateKey = process.env.TEST_PRIVATE_KEY; // For testing only
        const voterEthAddress = process.env.TEST_ACCOUNT_ADDRESS;

        const blockchainResult = await castVoteOnBlockchain(
            parseInt(electionId),
            parseInt(positionId),
            parseInt(candidateId),
            voterEthAddress,
            voterPrivateKey
        );

        if (!blockchainResult.success) {
            return res.status(500).json({
                success: false,
                error: 'Blockchain transaction failed: ' + blockchainResult.error
            });
        }

        // Record vote in database
        const insertQuery = `
            INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const dbResult = await pool.query(insertQuery, [
            voter.voter_id,
            electionId,
            positionId,
            candidateId,
            blockchainResult.transactionHash,
            blockchainResult.verificationCode
        ]);

        res.json({
            success: true,
            vote: dbResult.rows[0],
            transactionHash: blockchainResult.transactionHash,
            verificationCode: blockchainResult.verificationCode,
            blockNumber: blockchainResult.blockNumber
        });

    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Verify vote on blockchain
const verifyVoteOnChain = async (req, res) => {
    const { electionId, positionId, voterAddress } = req.body;
    
    try {
        const hasVoted = await verifyVote(electionId, positionId, voterAddress);
        
        res.json({
            success: true,
            hasVoted: hasVoted,
            message: hasVoted ? 'Vote verified on blockchain' : 'No vote found for this position'
        });
    } catch (error) {
        console.error('Error verifying vote:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Get blockchain election status
const getBlockchainElectionStatus = async (req, res) => {
    const { electionId } = req.params;
    
    try {
        const electionDetails = await getElectionDetails(parseInt(electionId));
        
        res.json({
            success: true,
            election: electionDetails
        });
    } catch (error) {
        console.error('Error getting election status:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = {
    castVote,
    verifyVoteOnChain,
    getBlockchainElectionStatus
};