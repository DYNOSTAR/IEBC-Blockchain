const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// TEST ROUTE - No authentication required (for testing)
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Election routes are working!', 
        timestamp: new Date().toISOString(),
        endpoints: {
            active: 'GET /api/elections/active (requires auth)',
            positions: 'GET /api/elections/:id/positions (requires auth)',
            cast: 'POST /api/elections/cast (requires auth)'
        }
    });
});

// PUBLIC: Get election status (no auth needed)
router.get('/status', async (req, res) => {
    try {
        const query = `
            SELECT id, name, status, start_date, end_date 
            FROM elections 
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
                message: 'No active election found' 
            });
        }
        
        res.json({ 
            success: true, 
            hasActiveElection: true,
            election: result.rows[0] 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get active election (requires authentication)
router.get('/active', authenticate, async (req, res) => {
    console.log('GET /api/elections/active - User:', req.user?.id);
    
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
                message: 'No active election found' 
            });
        }
        
        res.json({ 
            success: true, 
            hasActiveElection: true,
            election: result.rows[0] 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get positions with candidates for an election
router.get('/:electionId/positions', authenticate, async (req, res) => {
    const { electionId } = req.params;
    console.log(`GET /api/elections/${electionId}/positions - User:`, req.user?.id);
    
    try {
        const query = `
            SELECT 
                p.id,
                p.name as title,
                p.description,
                p.display_order,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'party', COALESCE(pp.name, 'Independent'),
                            'symbol', c.symbol,
                            'description', c.description
                        )
                    ) FILTER (WHERE c.id IS NOT NULL),
                    '[]'
                ) as candidates
            FROM positions p
            LEFT JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            LEFT JOIN political_parties pp ON c.political_party_id = pp.id
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
    
    console.log('POST /api/elections/cast - User:', userId, { electionId, positionId, candidateId });
    
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
            WHERE voter_id = $1 AND election_id = $2 AND position_id = $3
        `;
        const existingVote = await pool.query(checkQuery, [voterId, electionId, positionId]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Already voted for this position' });
        }
        
        // Generate verification code
        const verificationCode = 'V' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Record vote
        const insertQuery = `
            INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, verification_code
        `;
        const result = await pool.query(insertQuery, [voterId, electionId, positionId, candidateId, transactionHash || 'tx_' + Date.now(), verificationCode]);
        
        res.json({
            success: true,
            verificationCode: result.rows[0].verification_code,
            transactionHash: transactionHash || 'tx_' + Date.now(),
            message: 'Vote recorded successfully'
        });
        
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if voter has completed voting
router.get('/check-completion/:electionId', authenticate, async (req, res) => {
    const { electionId } = req.params;
    const userId = req.user.id;
    
    try {
        const voterQuery = `SELECT id FROM voters WHERE user_id = $1`;
        const voterResult = await pool.query(voterQuery, [userId]);
        
        if (voterResult.rows.length === 0) {
            return res.json({ success: true, completed: false });
        }
        
        const voterId = voterResult.rows[0].id;
        
        const positionsQuery = `SELECT COUNT(*) as total FROM positions WHERE election_id = $1`;
        const positionsResult = await pool.query(positionsQuery, [electionId]);
        const totalPositions = parseInt(positionsResult.rows[0].total);
        
        const votesQuery = `
            SELECT COUNT(DISTINCT position_id) as voted 
            FROM votes 
            WHERE voter_id = $1 AND election_id = $2
        `;
        const votesResult = await pool.query(votesQuery, [voterId, electionId]);
        const votedPositions = parseInt(votesResult.rows[0].voted);
        
        const completed = votedPositions === totalPositions;
        
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
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get election results (public)
router.get('/results/:electionId', async (req, res) => {
    const { electionId } = req.params;
    
    try {
        const query = `
            SELECT 
                p.name as position_name,
                p.id as position_id,
                c.name as candidate_name,
                COALESCE(pp.name, 'Independent') as party,
                c.symbol,
                COUNT(v.id) as vote_count,
                c.description
            FROM positions p
            JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            LEFT JOIN political_parties pp ON c.political_party_id = pp.id
            LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.name, c.id, c.name, pp.name, c.symbol, c.description
            ORDER BY p.display_order, vote_count DESC
        `;
        
        const result = await pool.query(query, [electionId]);
        
        const groupedResults = {};
        result.rows.forEach(row => {
            if (!groupedResults[row.position_name]) {
                groupedResults[row.position_name] = {
                    position_id: row.position_id,
                    candidates: []
                };
            }
            groupedResults[row.position_name].candidates.push({
                name: row.candidate_name,
                party: row.party,
                symbol: row.symbol,
                votes: parseInt(row.vote_count),
                description: row.description
            });
        });
        
        res.json({ success: true, results: groupedResults });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;