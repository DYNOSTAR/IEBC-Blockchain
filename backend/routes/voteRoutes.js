const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const {
    castVoteOnBlockchain,
    checkBlockchainConnection
} = require('../services/blockchainService');

// ── POST /api/votes/cast ──────────────────────────────────────
router.post('/cast', authenticate, async (req, res) => {
    const { candidateId, positionId, electionId } = req.body;
    const userId = req.user.id;

    if (!candidateId || !positionId) {
        return res.status(400).json({ success: false, error: 'candidateId and positionId are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Resolve active election if not provided
        let activeElectionId = electionId;
        if (!activeElectionId) {
            const electionResult = await client.query(
                `SELECT id FROM elections
                 WHERE status = 'active' AND start_date <= NOW() AND end_date >= NOW()
                 LIMIT 1`
            );
            if (electionResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, error: 'No active election found.' });
            }
            activeElectionId = electionResult.rows[0].id;
        }

        // 2. Get voter record + national_id (national_id is hashed before hitting the blockchain)
        const voterResult = await client.query(
            `SELECT v.id AS voter_id, u.national_id, u.is_active
             FROM voters v
             JOIN users u ON v.user_id = u.id
             WHERE v.user_id = $1`,
            [userId]
        );
        if (voterResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Voter record not found.' });
        }
        const { voter_id, national_id, is_active } = voterResult.rows[0];
        if (!is_active) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, error: 'Voter account is deactivated.' });
        }

        // 3. Verify candidate belongs to this election + position, fetch blockchain ID
        const candidateCheck = await client.query(
            `SELECT id, name, blockchain_candidate_id FROM candidates
             WHERE id = $1 AND position_id = $2 AND election_id = $3 AND is_active = true`,
            [candidateId, positionId, activeElectionId]
        );
        if (candidateCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Invalid candidate for this position.' });
        }
        const blockchainCandidateId = candidateCheck.rows[0].blockchain_candidate_id;
        if (!blockchainCandidateId) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, error: 'Candidate has no blockchain ID — run setupElection again.' });
        }

        // 4. Get position display_order (= blockchain position ID, 1–6)
        const positionResult = await client.query(
            `SELECT display_order FROM positions WHERE id = $1 AND election_id = $2`,
            [positionId, activeElectionId]
        );
        if (positionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Position not found for this election.' });
        }
        const blockchainPositionId = positionResult.rows[0].display_order;

        // 5. Prevent double-voting (row lock)
        const existingVote = await client.query(
            `SELECT id FROM votes
             WHERE voter_id = $1 AND position_id = $2 FOR UPDATE`,
            [voter_id, positionId]
        );
        if (existingVote.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'You have already voted for this position.' });
        }

        // 6. Record on blockchain — national_id is hashed inside castVoteOnBlockchain
        const blockchainResult = await castVoteOnBlockchain(
            blockchainPositionId,    // position display_order (1–6)
            blockchainCandidateId,   // chain ID, not DB id
            national_id              // hashed to sha256 bytes32 before hitting the chain
        );

        if (!blockchainResult.success) {
            await client.query('ROLLBACK');
            return res.status(500).json({
                success: false,
                error: 'Blockchain transaction failed: ' + blockchainResult.error
            });
        }

        // 7. Persist vote in DB
        await client.query(
            `INSERT INTO votes
               (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [voter_id, activeElectionId, positionId, candidateId,
             blockchainResult.transactionHash, blockchainResult.verificationCode]
        );

        // 8. Audit log
        await client.query(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, 'VOTE_CAST', $2)`,
            [userId, `Voted position ${positionId} (chain pos ${blockchainPositionId}) in election ${activeElectionId}. TX: ${blockchainResult.transactionHash}`]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Vote recorded on blockchain.',
            transactionHash: blockchainResult.transactionHash,
            verificationCode: blockchainResult.verificationCode,
            blockNumber: blockchainResult.blockNumber,
            simulated: blockchainResult.simulated || false
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cast vote error:', error.message);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    } finally {
        client.release();
    }
});

// ── POST /api/votes/verify ────────────────────────────────────
router.post('/verify', async (req, res) => {
    const { verificationCode } = req.body;
    if (!verificationCode) {
        return res.status(400).json({ success: false, error: 'verificationCode is required.' });
    }
    try {
        const result = await pool.query(
            `SELECT v.transaction_hash, v.created_at,
                    p.name AS position_title,
                    e.name AS election_name
             FROM votes v
             JOIN positions p ON v.position_id = p.id
             JOIN elections e ON v.election_id = e.id
             WHERE v.verification_code = $1`,
            [verificationCode]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Verification code not found.' });
        }
        const vote = result.rows[0];
        res.json({
            success: true,
            verified: true,
            vote: {
                electionName:    vote.election_name,
                positionTitle:   vote.position_title,
                transactionHash: vote.transaction_hash,
                votedAt:         vote.created_at
            }
        });
    } catch (error) {
        console.error('Verify vote error:', error.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ── GET /api/votes/election-status ───────────────────────────
router.get('/election-status', authenticate, async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, status FROM elections
             WHERE status = 'active' AND start_date <= NOW() AND end_date >= NOW()
             LIMIT 1`
        );
        const isActive = result.rows.length > 0;
        res.json({ success: true, isActive, election: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ── GET /api/votes/blockchain-status ─────────────────────────
router.get('/blockchain-status', async (_req, res) => {
    try {
        const status = await checkBlockchainConnection();
        res.json({ success: true, blockchain: status });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ── GET /api/votes/counts/:electionId ────────────────────────
// Live vote counts per position (used by admin dashboards)
router.get('/counts/:electionId', authenticate, async (req, res) => {
    const { electionId } = req.params;
    try {
        const result = await pool.query(
            `SELECT p.id AS position_id, p.name AS position, p.display_order,
                    c.id AS candidate_id, c.name AS candidate, c.symbol AS party,
                    COUNT(v.id) AS vote_count
             FROM positions p
             JOIN candidates c ON c.position_id = p.id AND c.election_id = $1 AND c.is_active = true
             LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = $1
             WHERE p.election_id = $1
             GROUP BY p.id, p.name, p.display_order, c.id, c.name, c.symbol
             ORDER BY p.display_order, vote_count DESC`,
            [electionId]
        );
        const grouped = {};
        for (const row of result.rows) {
            if (!grouped[row.position]) {
                grouped[row.position] = { positionId: row.position_id, candidates: [] };
            }
            grouped[row.position].candidates.push({
                id: row.candidate_id, name: row.candidate,
                party: row.party, votes: parseInt(row.vote_count)
            });
        }
        res.json({ success: true, results: grouped });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
