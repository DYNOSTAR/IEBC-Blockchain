const pool = require('../config/db');
const { castVoteOnBlockchain, verifyVote, getElectionDetails, getBlockchainVoteCount } = require('../config/blockchain');

// Cast vote - server signs transaction (voter does not expose private key)
const castVote = async (req, res) => {
    const { electionId, positionId, candidateId } = req.body;
    const userId = req.user.id;
    const voterId = req.user.voterId;

    if (!electionId || !positionId || !candidateId) {
        return res.status(400).json({ success: false, error: 'electionId, positionId, and candidateId are required.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify election is active
        const electionResult = await client.query(
            `SELECT * FROM elections WHERE id = $1 AND status = 'active' AND start_date <= NOW() AND end_date >= NOW()`,
            [electionId]
        );
        if (electionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Election is not active.' });
        }

        // 2. Verify voter exists and is active
        const voterResult = await client.query(
            `SELECT v.id as voter_id, v.national_id, v.has_voted, u.is_active
             FROM voters v JOIN users u ON v.user_id = u.id
             WHERE v.user_id = $1`,
            [userId]
        );
        if (voterResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Voter not found.' });
        }

        const voter = voterResult.rows[0];
        if (!voter.is_active) {
            await client.query('ROLLBACK');
            return res.status(403).json({ success: false, error: 'Voter account is deactivated.' });
        }

        // 3. Verify position belongs to this election
        const positionResult = await client.query(
            `SELECT * FROM positions WHERE id = $1 AND election_id = $2`,
            [positionId, electionId]
        );
        if (positionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Invalid position for this election.' });
        }

        // 4. Verify candidate belongs to this position
        const candidateResult = await client.query(
            `SELECT * FROM candidates WHERE id = $1 AND position_id = $2 AND election_id = $3`,
            [candidateId, positionId, electionId]
        );
        if (candidateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Invalid candidate for this position.' });
        }

        // 5. Check for duplicate vote (use SELECT FOR UPDATE to prevent race conditions)
        const existingVote = await client.query(
            `SELECT id FROM votes WHERE voter_id = $1 AND election_id = $2 AND position_id = $3 FOR UPDATE`,
            [voter.voter_id, electionId, positionId]
        );
        if (existingVote.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'You have already voted for this position.' });
        }

        // 6. Cast vote on blockchain (server account signs the transaction)
        const blockchainResult = await castVoteOnBlockchain(
            parseInt(electionId),
            parseInt(positionId),
            parseInt(candidateId)
        );

        if (!blockchainResult.success) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, error: 'Blockchain transaction failed: ' + blockchainResult.error });
        }

        // 7. Record vote in database (no voter identity stored — only voter_id + tx hash)
        const insertResult = await client.query(
            `INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code, voted_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id, transaction_hash, verification_code, voted_at`,
            [voter.voter_id, electionId, positionId, candidateId, blockchainResult.transactionHash, blockchainResult.verificationCode]
        );

        // 8. Audit log
        await client.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [userId, 'VOTE_CAST', `Vote cast for position ${positionId} in election ${electionId}. TX: ${blockchainResult.transactionHash}`]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Vote cast successfully.',
            transactionHash: blockchainResult.transactionHash,
            verificationCode: blockchainResult.verificationCode,
            blockNumber: blockchainResult.blockNumber,
            votedAt: insertResult.rows[0].voted_at
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cast vote error:', error);
        res.status(500).json({ success: false, error: 'Server error while casting vote.' });
    } finally {
        client.release();
    }
};

// Verify vote on blockchain using verification code
const verifyVoteByCode = async (req, res) => {
    const { verificationCode } = req.body;

    if (!verificationCode) {
        return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }

    try {
        const result = await pool.query(
            `SELECT v.transaction_hash, v.voted_at, v.election_id, v.position_id,
                    p.title as position_title, e.name as election_name
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
                electionName: vote.election_name,
                positionTitle: vote.position_title,
                transactionHash: vote.transaction_hash,
                votedAt: vote.voted_at
            }
        });

    } catch (error) {
        console.error('Verify vote error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Get blockchain election status
const getBlockchainElectionStatus = async (req, res) => {
    const { electionId } = req.params;

    if (!electionId || isNaN(electionId)) {
        return res.status(400).json({ success: false, error: 'Valid electionId is required.' });
    }

    try {
        const electionDetails = await getElectionDetails(parseInt(electionId));
        if (!electionDetails) {
            return res.status(404).json({ success: false, error: 'Election not found on blockchain.' });
        }
        res.json({ success: true, election: electionDetails });
    } catch (error) {
        console.error('Get blockchain election status error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Get real-time vote counts (from DB, cross-verified with blockchain count)
const getVoteCounts = async (req, res) => {
    const { electionId } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.id as position_id, p.title as position,
                    c.id as candidate_id, c.name as candidate, c.party,
                    COUNT(v.id) as vote_count
             FROM positions p
             JOIN candidates c ON c.position_id = p.id AND c.election_id = $1
             LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = $1
             WHERE p.election_id = $1
             GROUP BY p.id, p.title, p.display_order, c.id, c.name, c.party
             ORDER BY p.display_order, vote_count DESC`,
            [electionId]
        );

        // Group by position
        const grouped = {};
        for (const row of result.rows) {
            if (!grouped[row.position]) grouped[row.position] = { positionId: row.position_id, candidates: [] };
            grouped[row.position].candidates.push({
                id: row.candidate_id,
                name: row.candidate,
                party: row.party,
                votes: parseInt(row.vote_count)
            });
        }

        res.json({ success: true, results: grouped });

    } catch (error) {
        console.error('Get vote counts error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

module.exports = { castVote, verifyVoteByCode, getBlockchainElectionStatus, getVoteCounts };