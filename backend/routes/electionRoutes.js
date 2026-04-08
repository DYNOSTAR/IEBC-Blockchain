const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get active election (for voters)
router.get('/active', authenticate, async (req, res) => {
    try {
        const query = `
            SELECT * FROM elections 
            WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date >= NOW()
            LIMIT 1
        `;
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return res.json({ 
                success: true, 
                hasActiveElection: false,
                message: 'No active election at this time' 
            });
        }
        
        res.json({ 
            success: true, 
            hasActiveElection: true,
            election: result.rows[0] 
        });
    } catch (error) {
        console.error('Error getting active election:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get positions with candidates for an election
router.get('/:electionId/positions', authenticate, async (req, res) => {
    const { electionId } = req.params;
    
    try {
        const query = `
            SELECT 
                p.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'party', c.party,
                            'symbol', c.symbol,
                            'description', c.description
                        )
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as candidates
            FROM positions p
            LEFT JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id
            ORDER BY p.display_order
        `;
        const result = await pool.query(query, [electionId]);
        
        res.json({ success: true, positions: result.rows });
    } catch (error) {
        console.error('Error getting positions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cast vote
router.post('/cast', authenticate, async (req, res) => {
    const { electionId, positionId, candidateId, transactionHash } = req.body;
    const userId = req.user.id;
    
    try {
        // Check if user is a voter
        const voterQuery = `SELECT id, has_voted FROM voters WHERE user_id = $1`;
        const voterResult = await pool.query(voterQuery, [userId]);
        
        if (voterResult.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'Voter not found' });
        }
        
        const voter = voterResult.rows[0];
        
        // Check if election is active
        const electionQuery = `
            SELECT * FROM elections 
            WHERE id = $1 AND status = 'active' 
            AND start_date <= NOW() AND end_date >= NOW()
        `;
        const electionResult = await pool.query(electionQuery, [electionId]);
        
        if (electionResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Election is not active' });
        }
        
        // Check if already voted for this position
        const checkVoteQuery = `
            SELECT * FROM votes 
            WHERE voter_id = $1 AND election_id = $2 AND position_id = $3
        `;
        const existingVote = await pool.query(checkVoteQuery, [voter.id, electionId, positionId]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Already voted for this position' });
        }
        
        // Record vote
        const verificationCode = generateVerificationCode();
        const insertQuery = `
            INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [
            voter.id, electionId, positionId, candidateId, transactionHash, verificationCode
        ]);
        
        res.json({ 
            success: true, 
            vote: result.rows[0],
            verificationCode: verificationCode
        });
        
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if voter has completed voting for all positions
router.get('/check-completion/:electionId', authenticate, async (req, res) => {
    const { electionId } = req.params;
    const userId = req.user.id;
    
    try {
        // Get voter
        const voterQuery = `SELECT id FROM voters WHERE user_id = $1`;
        const voterResult = await pool.query(voterQuery, [userId]);
        
        if (voterResult.rows.length === 0) {
            return res.json({ success: true, completed: false });
        }
        
        const voterId = voterResult.rows[0].id;
        
        // Get total positions for this election
        const positionsQuery = `SELECT COUNT(*) as total FROM positions WHERE election_id = $1`;
        const positionsResult = await pool.query(positionsQuery, [electionId]);
        const totalPositions = parseInt(positionsResult.rows[0].total);
        
        // Get votes cast by this voter
        const votesQuery = `
            SELECT COUNT(DISTINCT position_id) as voted 
            FROM votes 
            WHERE voter_id = $1 AND election_id = $2
        `;
        const votesResult = await pool.query(votesQuery, [voterId, electionId]);
        const votedPositions = parseInt(votesResult.rows[0].voted);
        
        const completed = votedPositions === totalPositions;
        
        // Update voter's has_voted status if completed
        if (completed) {
            await pool.query(`UPDATE voters SET has_voted = TRUE WHERE id = $1`, [voterId]);
        }
        
        res.json({ 
            success: true, 
            completed: completed,
            votedPositions: votedPositions,
            totalPositions: totalPositions
        });
        
    } catch (error) {
        console.error('Error checking completion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get results for an election
router.get('/results/:electionId', async (req, res) => {
    const { electionId } = req.params;
    
    try {
        const query = `
            SELECT 
                p.title as position,
                c.name as candidate,
                c.party,
                c.symbol,
                COUNT(v.id) as vote_count
            FROM positions p
            JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.title, c.id, c.name, c.party, c.symbol
            ORDER BY p.display_order, vote_count DESC
        `;
        const result = await pool.query(query, [electionId]);
        
        // Group by position
        const groupedResults = {};
        result.rows.forEach(row => {
            if (!groupedResults[row.position]) {
                groupedResults[row.position] = [];
            }
            groupedResults[row.position].push({
                candidate: row.candidate,
                party: row.party,
                symbol: row.symbol,
                votes: parseInt(row.vote_count)
            });
        });
        
        res.json({ success: true, results: groupedResults });
        
    } catch (error) {
        console.error('Error getting results:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function
function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = router;