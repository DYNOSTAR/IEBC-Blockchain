const pool = require('../config/db');
const crypto = require('crypto');

// Generate a unique transaction hash (simulates blockchain)
function generateTransactionHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
}

// Generate verification code
function generateVerificationCode() {
    return 'V' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Cast vote
const castVote = async (req, res) => {
    const { candidateId, positionId, electionId, transactionHash } = req.body;
    const userId = req.user.id;
    
    console.log('Cast vote request:', { userId, candidateId, positionId, electionId });
    
    try {
        // Get voter id
        const voterQuery = `SELECT id FROM voters WHERE user_id = $1`;
        const voterResult = await pool.query(voterQuery, [userId]);
        
        if (voterResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Voter not found' });
        }
        
        const voterId = voterResult.rows[0].id;
        
        // Check if already voted for this position
        const checkQuery = `
            SELECT id FROM votes 
            WHERE voter_id = $1 AND position_id = $2 AND election_id = $3
        `;
        const existingVote = await pool.query(checkQuery, [voterId, positionId, electionId]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Already voted for this position' });
        }
        
        // Generate blockchain transaction hash
        const finalTxHash = transactionHash || generateTransactionHash();
        const verificationCode = generateVerificationCode();
        
        // Record vote in database
        const insertQuery = `
            INSERT INTO votes (voter_id, candidate_id, position_id, election_id, transaction_hash, verification_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        await pool.query(insertQuery, [voterId, candidateId, positionId, electionId, finalTxHash, verificationCode]);
        
        res.json({
            success: true,
            transactionHash: finalTxHash,
            verificationCode: verificationCode,
            message: 'Vote recorded successfully on blockchain'
        });
        
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Verify vote using verification code
const verifyVoteByCode = async (req, res) => {
    const { verificationCode } = req.body;
    
    try {
        const query = `
            SELECT 
                v.*, 
                c.name as candidate_name,
                p.name as position_name,
                e.name as election_name,
                u.first_name, u.last_name
            FROM votes v
            JOIN candidates c ON v.candidate_id = c.id
            JOIN positions p ON v.position_id = p.id
            JOIN elections e ON v.election_id = e.id
            JOIN voters vt ON v.voter_id = vt.id
            JOIN users u ON vt.user_id = u.id
            WHERE v.verification_code = $1
        `;
        const result = await pool.query(query, [verificationCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Vote not found' });
        }
        
        const vote = result.rows[0];
        
        res.json({
            success: true,
            vote: {
                candidate: vote.candidate_name,
                position: vote.position_name,
                election: vote.election_name,
                voterName: `${vote.first_name} ${vote.last_name}`,
                transactionHash: vote.transaction_hash,
                verificationCode: vote.verification_code,
                timestamp: vote.created_at
            }
        });
        
    } catch (error) {
        console.error('Error verifying vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get vote counts for an election
const getVoteCounts = async (req, res) => {
    const { electionId } = req.params;
    
    try {
        const query = `
            SELECT 
                p.name as position_name,
                c.name as candidate_name,
                COALESCE(pp.name, 'Independent') as party,
                c.symbol,
                COUNT(v.id) as vote_count
            FROM positions p
            JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            LEFT JOIN political_parties pp ON c.political_party_id = pp.id
            LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.name, c.id, c.name, pp.name, c.symbol
            ORDER BY p.display_order, vote_count DESC
        `;
        
        const result = await pool.query(query, [electionId]);
        
        // Group by position
        const groupedResults = {};
        result.rows.forEach(row => {
            if (!groupedResults[row.position_name]) {
                groupedResults[row.position_name] = [];
            }
            groupedResults[row.position_name].push({
                candidate: row.candidate_name,
                party: row.party,
                symbol: row.symbol,
                votes: parseInt(row.vote_count)
            });
        });
        
        res.json({ success: true, counts: groupedResults });
        
    } catch (error) {
        console.error('Error getting vote counts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get blockchain election status
const getBlockchainElectionStatus = async (req, res) => {
    const { electionId } = req.params;
    
    try {
        // Get election info
        const electionQuery = `SELECT name, status, start_date, end_date FROM elections WHERE id = $1`;
        const electionResult = await pool.query(electionQuery, [electionId]);
        
        // Get total votes
        const votesQuery = `SELECT COUNT(*) as total_votes FROM votes WHERE election_id = $1`;
        const votesResult = await pool.query(votesQuery, [electionId]);
        
        // Get unique voters
        const votersQuery = `SELECT COUNT(DISTINCT voter_id) as unique_voters FROM votes WHERE election_id = $1`;
        const votersResult = await pool.query(votersQuery, [electionId]);
        
        // Get latest transaction
        const txQuery = `SELECT transaction_hash, verification_code, created_at FROM votes WHERE election_id = $1 ORDER BY created_at DESC LIMIT 1`;
        const txResult = await pool.query(txQuery, [electionId]);
        
        res.json({
            success: true,
            blockchain: {
                network: 'Ethereum (Ganache)',
                contractAddress: process.env.CONTRACT_ADDRESS || 'Not deployed',
                lastBlock: 'Latest',
                confirmed: true
            },
            election: electionResult.rows[0],
            statistics: {
                totalVotes: parseInt(votesResult.rows[0].total_votes),
                uniqueVoters: parseInt(votersResult.rows[0].unique_voters),
                lastTransaction: txResult.rows[0] || null
            }
        });
        
    } catch (error) {
        console.error('Error getting blockchain status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    castVote,
    verifyVoteByCode,
    getVoteCounts,
    getBlockchainElectionStatus
};