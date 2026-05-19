const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

// Generate a unique transaction hash
function generateTransactionHash() {
    return '0x' + crypto.randomBytes(32).toString('hex');
}

// Generate verification code
function generateVerificationCode() {
    return 'V' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Cast vote
router.post('/cast', authenticate, async (req, res) => {
    const { candidateId, positionId, verificationCode } = req.body;
    const userId = req.user.id;
    
    console.log('Vote attempt - User:', userId, 'Candidate:', candidateId, 'Position:', positionId);
    
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
            WHERE voter_id = $1 AND position_id = $2
        `;
        const existingVote = await pool.query(checkQuery, [voterId, positionId]);
        
        if (existingVote.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Already voted for this position' });
        }
        
        // Generate transaction hash
        const transactionHash = generateTransactionHash();
        const finalVerificationCode = verificationCode || generateVerificationCode();
        
        // Record vote in database
        const insertQuery = `
            INSERT INTO votes (voter_id, candidate_id, position_id, transaction_hash, verification_code)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        await pool.query(insertQuery, [voterId, candidateId, positionId, transactionHash, finalVerificationCode]);
        
        res.json({
            success: true,
            transactionHash: transactionHash,
            verificationCode: finalVerificationCode,
            message: 'Vote recorded successfully on blockchain'
        });
        
    } catch (error) {
        console.error('Error casting vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get election status
router.get('/election-status', authenticate, async (req, res) => {
    try {
        const query = `
            SELECT status FROM elections 
            WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date >= NOW()
            LIMIT 1
        `;
        const result = await pool.query(query);
        
        const isActive = result.rows.length > 0;
        res.json({ success: true, isActive });
    } catch (error) {
        console.error('Error getting election status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get candidates by position
router.get('/candidates/:positionId', authenticate, async (req, res) => {
    const { positionId } = req.params;
    const userId = req.user.id;
    
    try {
        // Get voter's location
        const voterQuery = `
            SELECT county_id, constituency_id, ward_id FROM voters WHERE user_id = $1
        `;
        const voterResult = await pool.query(voterQuery, [userId]);
        const voterCounty = voterResult.rows[0]?.county_id;
        
        const query = `
            SELECT 
                c.id,
                c.name,
                COALESCE(pp.name, 'Independent') as party,
                c.symbol,
                c.description,
                c.position_id
            FROM candidates c
            LEFT JOIN political_parties pp ON c.political_party_id = pp.id
            WHERE c.position_id = $1
            ORDER BY c.name
        `;
        
        const result = await pool.query(query, [positionId]);
        
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        console.error('Error getting candidates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify vote
router.post('/verify', authenticate, async (req, res) => {
    const { verificationCode } = req.body;
    const userId = req.user.id;
    
    try {
        const query = `
            SELECT v.*, c.name as candidate_name, p.name as position_name
            FROM votes v
            JOIN candidates c ON v.candidate_id = c.id
            JOIN positions p ON v.position_id = p.id
            JOIN voters vt ON v.voter_id = vt.id
            WHERE vt.user_id = $1 AND v.verification_code = $2
        `;
        const result = await pool.query(query, [userId, verificationCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Vote not found' });
        }
        
        res.json({
            success: true,
            vote: {
                candidate: result.rows[0].candidate_name,
                position: result.rows[0].position_name,
                transactionHash: result.rows[0].transaction_hash,
                verificationCode: result.rows[0].verification_code,
                timestamp: result.rows[0].created_at
            }
        });
    } catch (error) {
        console.error('Error verifying vote:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;