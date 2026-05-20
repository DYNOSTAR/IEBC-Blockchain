const pool = require('../config/db');
const { castVoteOnBlockchain, checkBlockchainConnection, votingContract } = require('../services/blockchainService');

// ── Cast Vote ─────────────────────────────────────────────────
const castVote = async (req, res) => {
    const { electionId, positionId, candidateId } = req.body;
    const userId = req.user.id;

    if (!electionId || !positionId || !candidateId) {
        return res.status(400).json({
            success: false,
            error: 'electionId, positionId, and candidateId are required.'
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Verify election is active
        const electionResult = await client.query(
            `SELECT * FROM elections
             WHERE id = $1 AND status = 'active'
             AND start_date <= NOW() AND end_date >= NOW()`,
            [electionId]
        );
        if (electionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Election is not active or has ended.' });
        }

        // 2. Get voter record + national_id for blockchain hashing
        const voterResult = await client.query(
            `SELECT v.id AS voter_id, v.has_voted, u.is_active, u.national_id
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

        // 3. Verify position belongs to election + get display_order (blockchain position ID)
        const positionResult = await client.query(
            `SELECT id, name, display_order FROM positions WHERE id = $1 AND election_id = $2`,
            [positionId, electionId]
        );
        if (positionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Invalid position for this election.' });
        }
        const blockchainPositionId = positionResult.rows[0].display_order;

        // 4. Verify candidate is valid and fetch blockchain_candidate_id
        const candidateResult = await client.query(
            `SELECT id, name, symbol, blockchain_candidate_id FROM candidates
             WHERE id = $1 AND position_id = $2 AND election_id = $3 AND is_active = true`,
            [candidateId, positionId, electionId]
        );
        if (candidateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, error: 'Invalid candidate for this position.' });
        }
        const blockchainCandidateId = candidateResult.rows[0].blockchain_candidate_id;
        if (!blockchainCandidateId) {
            await client.query('ROLLBACK');
            return res.status(500).json({ success: false, error: 'Candidate has no blockchain ID — run setupElection again.' });
        }

        // 5. Prevent double-voting (row lock)
        const existingVote = await client.query(
            `SELECT id FROM votes
             WHERE voter_id = $1 AND election_id = $2 AND position_id = $3 FOR UPDATE`,
            [voter.voter_id, electionId, positionId]
        );
        if (existingVote.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'You have already voted for this position.' });
        }

        // 6. Cast on blockchain — national_id hashed inside castVoteOnBlockchain
        const blockchainResult = await castVoteOnBlockchain(
            blockchainPositionId,   // display_order 1–6
            blockchainCandidateId,  // chain ID from blockchain_candidate_id column
            voter.national_id       // hashed to sha256 bytes32 before hitting the chain
        );

        if (!blockchainResult.success) {
            await client.query('ROLLBACK');
            return res.status(500).json({
                success: false,
                error: 'Blockchain transaction failed: ' + blockchainResult.error
            });
        }

        // 7. Record in DB — uses created_at (not voted_at)
        await client.query(
            `INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, verification_code)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [voter.voter_id, electionId, positionId, candidateId,
             blockchainResult.transactionHash, blockchainResult.verificationCode]
        );

        // 8. Audit log
        await client.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [userId, 'VOTE_CAST',
             `Vote for position ${positionId} (chain pos ${blockchainPositionId}) in election ${electionId}. TX: ${blockchainResult.transactionHash}`]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Vote cast successfully.',
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
};

// ── Verify vote by code ───────────────────────────────────────
const verifyVoteByCode = async (req, res) => {
    const { verificationCode } = req.body;
    if (!verificationCode) {
        return res.status(400).json({ success: false, error: 'Verification code is required.' });
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
};

// ── Get results with blockchain cross-verification + winners ──
// Accepts ?countyId=X&constituencyId=Y&wardId=Z to scope candidates to one area.
// Candidates with NULL location fields are included regardless of filter (backward-compat).
const getElectionResults = async (req, res) => {
    const { id: electionId } = req.params;
    const countyId       = req.query.countyId       ? parseInt(req.query.countyId)       : null;
    const constituencyId = req.query.constituencyId ? parseInt(req.query.constituencyId) : null;
    const wardId         = req.query.wardId         ? parseInt(req.query.wardId)         : null;

    try {
        // 1. Get votes from DB — scoped to the requested location
        const dbResult = await pool.query(
            `SELECT
                p.id                       AS position_id,
                p.name                     AS position_name,
                p.display_order,
                p.level,
                c.id                       AS candidate_id,
                c.blockchain_candidate_id  AS blockchain_candidate_id,
                c.name                     AS candidate_name,
                c.symbol                   AS party,
                COUNT(v.id)                AS db_votes
             FROM positions p
             JOIN candidates c
                ON  c.position_id = p.id
                AND c.election_id = $1
                AND c.is_active   = true
                AND (
                    p.level = 'national'
                    OR (p.level = 'county'
                        AND ($2::int IS NULL OR c.county_id IS NULL OR c.county_id = $2::int))
                    OR (p.level = 'constituency'
                        AND ($3::int IS NULL OR c.constituency_id IS NULL OR c.constituency_id = $3::int))
                    OR (p.level = 'ward'
                        AND ($4::int IS NULL OR c.ward_id IS NULL OR c.ward_id = $4::int))
                )
             LEFT JOIN votes v
                ON v.candidate_id = c.id AND v.election_id = $1
             WHERE p.election_id = $1
             GROUP BY p.id, p.name, p.display_order, p.level,
                      c.id, c.blockchain_candidate_id, c.name, c.symbol
             ORDER BY p.display_order ASC, db_votes DESC`,
            [electionId, countyId, constituencyId, wardId]
        );

        // 2. Get blockchain vote counts for cross-verification (use blockchain_candidate_id, not DB id)
        const blockchainCounts = {};
        if (votingContract) {
            try {
                for (const row of dbResult.rows) {
                    if (!row.blockchain_candidate_id) { blockchainCounts[row.candidate_id] = null; continue; }
                    try {
                        const candidate = await votingContract.methods
                            .getCandidate(parseInt(row.blockchain_candidate_id))
                            .call();
                        blockchainCounts[row.candidate_id] = parseInt(candidate.voteCount || 0);
                    } catch { blockchainCounts[row.candidate_id] = null; }
                }
            } catch (e) {
                console.warn('Blockchain read failed, using DB only:', e.message);
            }
        }

        // 3. Build results grouped by position with winner + integrity check
        const positionsMap = {};
        for (const row of dbResult.rows) {
            if (!positionsMap[row.position_id]) {
                positionsMap[row.position_id] = {
                    positionId:   row.position_id,
                    positionName: row.position_name,
                    level:        row.level,
                    displayOrder: parseInt(row.display_order),
                    candidates:   [],
                    totalVotes:   0
                };
            }
            const dbVotes = parseInt(row.db_votes);
            const chainVotes = blockchainCounts[row.candidate_id];
            positionsMap[row.position_id].candidates.push({
                id:              row.candidate_id,
                name:            row.candidate_name,
                party:           row.party,
                dbVotes,
                chainVotes,
                // integrity: does DB match blockchain?
                verified:        chainVotes === null ? null : (dbVotes === chainVotes)
            });
            positionsMap[row.position_id].totalVotes += dbVotes;
        }

        // 4. Sort candidates by votes, compute percentages, determine winner
        const positions = Object.values(positionsMap)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(pos => {
                const sorted = pos.candidates.sort((a, b) => b.dbVotes - a.dbVotes);
                const withPct = sorted.map(c => ({
                    ...c,
                    percentage: pos.totalVotes > 0
                        ? Math.round((c.dbVotes / pos.totalVotes) * 1000) / 10
                        : 0
                }));
                // Winner: highest votes (for president: must also have >50% OR check county spread)
                const winner = withPct[0]?.dbVotes > 0 ? withPct[0] : null;
                return { ...pos, candidates: withPct, winner };
            });

        // 5. Overall turnout
        const turnoutResult = await pool.query(
            `SELECT COUNT(DISTINCT voter_id) as voted FROM votes WHERE election_id = $1`,
            [electionId]
        );
        const registeredResult = await pool.query(`SELECT COUNT(*) as total FROM voters`);
        const totalVotesCast = parseInt(turnoutResult.rows[0].voted);
        const totalRegistered = parseInt(registeredResult.rows[0].total);

        // 6. Blockchain health
        const blockchainStatus = await checkBlockchainConnection();

        res.json({
            success: true,
            electionId: parseInt(electionId),
            positions,
            turnout: {
                voted:      totalVotesCast,
                registered: totalRegistered,
                percentage: totalRegistered > 0
                    ? Math.round((totalVotesCast / totalRegistered) * 1000) / 10
                    : 0
            },
            blockchain: {
                connected:      blockchainStatus.connected,
                electionActive: blockchainStatus.electionActive,
                contractAddress: blockchainStatus.contractAddress
            },
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get election results error:', error.message);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    }
};

// ── Blockchain status ─────────────────────────────────────────
const getBlockchainElectionStatus = async (req, res) => {
    try {
        const status = await checkBlockchainConnection();
        res.json({ success: true, blockchain: status });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// ── Live vote counts ──────────────────────────────────────────
const getVoteCounts = async (req, res) => {
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
            if (!grouped[row.position]) grouped[row.position] = { positionId: row.position_id, candidates: [] };
            grouped[row.position].candidates.push({
                id: row.candidate_id, name: row.candidate,
                party: row.party, votes: parseInt(row.vote_count)
            });
        }
        res.json({ success: true, results: grouped });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

module.exports = { castVote, verifyVoteByCode, getElectionResults, getBlockchainElectionStatus, getVoteCounts };