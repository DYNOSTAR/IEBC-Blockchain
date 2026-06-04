const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const {
    getAllElections, getActiveElection, getElectionById,
    createElection, updateElectionStatus, getPositions, addCandidate
} = require('../controllers/electionController');
const { getElectionResults } = require('../controllers/voteController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ── Public ─────────────────────────────────────────────────────
router.get('/results/:id', getElectionResults);

// ── Specific named paths MUST come before wildcard /:id ────────
router.get('/active',  authenticate, getActiveElection);

// ── All elections with summary stats ──────────────────────────
router.get('/admin/all-stats', authenticate, isAdmin, async (req, res) => {
    try {
        const rows = await pool.query(
            `SELECT e.*,
                    COUNT(DISTINCT v.voter_id) AS votes_cast,
                    COUNT(DISTINCT p.id)        AS position_count,
                    COUNT(DISTINCT c.id)        AS candidate_count
             FROM elections e
             LEFT JOIN votes v     ON v.election_id = e.id
             LEFT JOIN positions p ON p.election_id = e.id
             LEFT JOIN candidates c ON c.election_id = e.id AND c.is_active = true
             GROUP BY e.id
             ORDER BY e.created_at DESC`
        );
        const registered = parseInt(
            (await pool.query(`SELECT COUNT(*) AS n FROM voters`)).rows[0].n
        );
        const elections = rows.rows.map(r => ({
            ...r,
            votes_cast:      parseInt(r.votes_cast),
            position_count:  parseInt(r.position_count),
            candidate_count: parseInt(r.candidate_count),
            turnout_pct: registered > 0
                ? Math.round((parseInt(r.votes_cast) / registered) * 1000) / 10
                : 0
        }));
        res.json({ success: true, elections, registered });
    } catch (err) {
        console.error('All-stats error:', err.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ── Per-election report ───────────────────────────────────────
router.get('/:id/report', authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const elecRow = await pool.query(`SELECT * FROM elections WHERE id = $1`, [id]);
        if (!elecRow.rows.length)
            return res.status(404).json({ success: false, error: 'Election not found' });

        const turnoutRow    = await pool.query(`SELECT COUNT(DISTINCT voter_id) AS voted FROM votes WHERE election_id = $1`, [id]);
        const registeredRow = await pool.query(`SELECT COUNT(*) AS total FROM voters`);

        const breakdown = await pool.query(
            `SELECT p.id AS position_id, p.name AS position_name, p.level,
                    c.id AS candidate_id, c.name AS candidate_name, c.symbol AS party,
                    COUNT(v.id) AS votes
             FROM positions p
             LEFT JOIN candidates c ON c.position_id = p.id AND c.election_id = $1 AND c.is_active = true
             LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = $1
             WHERE p.election_id = $1
             GROUP BY p.id, p.name, p.level, p.display_order, c.id, c.name, c.symbol
             ORDER BY p.display_order, votes DESC`,
            [id]
        );

        const positions = {};
        breakdown.rows.forEach(r => {
            if (!r.candidate_id) return;
            if (!positions[r.position_id]) {
                positions[r.position_id] = { name: r.position_name, level: r.level, candidates: [], totalVotes: 0 };
            }
            const v = parseInt(r.votes);
            positions[r.position_id].candidates.push({ id: r.candidate_id, name: r.candidate_name, party: r.party, votes: v });
            positions[r.position_id].totalVotes += v;
        });

        const voted      = parseInt(turnoutRow.rows[0].voted);
        const registered = parseInt(registeredRow.rows[0].total);

        res.json({
            success: true,
            election: elecRow.rows[0],
            turnout: { voted, registered, percentage: registered > 0 ? Math.round((voted / registered) * 1000) / 10 : 0 },
            positions: Object.values(positions)
        });
    } catch (err) {
        console.error('Election report error:', err.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

// ── Wildcard /:id AFTER all specific paths ─────────────────────
router.get('/:id/positions', authenticate, getPositions);
router.get('/:id',           authenticate, getElectionById);

// ── Admin CRUD ─────────────────────────────────────────────────
router.get('/',    authenticate, isAdmin, getAllElections);
router.post('/',   authenticate, isAdmin, createElection);
router.patch('/:id/status', authenticate, isAdmin, updateElectionStatus);
router.post('/:electionId/positions/:positionId/candidates', authenticate, isAdmin, addCandidate);

// ── Lock / Unlock ─────────────────────────────────────────────
router.patch('/:id/lock', authenticate, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { locked } = req.body;
    if (typeof locked !== 'boolean')
        return res.status(400).json({ success: false, error: 'locked must be true or false' });
    try {
        const result = await pool.query(
            `UPDATE elections SET is_locked = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [locked, id]
        );
        if (!result.rows.length)
            return res.status(404).json({ success: false, error: 'Election not found' });
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
            [req.user.id, locked ? 'ELECTION_LOCKED' : 'ELECTION_UNLOCKED',
             `Election ${id} ${locked ? 'locked' : 'unlocked'} by user ${req.user.id}`]
        );
        res.json({ success: true, election: result.rows[0] });
    } catch (err) {
        console.error('Lock election error:', err.message);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
});

module.exports = router;
