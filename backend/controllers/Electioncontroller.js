const pool = require('../config/db');
const Election = require('../models/Election');

const getAllElections = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description, status, start_date, end_date, created_at
             FROM elections ORDER BY created_at DESC`
        );
        res.json({ success: true, elections: result.rows });
    } catch (error) {
        console.error('Get all elections error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const getActiveElection = async (req, res) => {
    try {
        const election = await Election.getActiveElection();
        if (!election) {
            return res.status(404).json({ success: false, error: 'No active election found.' });
        }
        const positions = await getPositionsWithCandidates(election.id);
        res.json({ success: true, election: { ...election, positions } });
    } catch (error) {
        console.error('Get active election error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const getElectionById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM elections WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found.' });
        }
        const positions = await getPositionsWithCandidates(id);
        res.json({ success: true, election: { ...result.rows[0], positions } });
    } catch (error) {
        console.error('Get election by ID error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// ── Internal helper ─────────────────────────────────────────────
// location = { countyId, constituencyId, wardId } — all optional.
// When a filter is provided, candidates are narrowed to that area.
// Candidates with NULL location fields are shown regardless (demo/backward-compat).
async function getPositionsWithCandidates(electionId, location = {}) {
    const { countyId, constituencyId, wardId } = location;
    const result = await pool.query(
        `SELECT
            p.id,
            p.name        AS title,
            p.description,
            p.display_order,
            p.level,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id',              c.id,
                        'name',            c.name,
                        'party',           c.symbol,
                        'symbol',          c.symbol,
                        'description',     c.description,
                        'county_id',       c.county_id,
                        'constituency_id', c.constituency_id,
                        'ward_id',         c.ward_id
                    ) ORDER BY c.name
                ) FILTER (
                    WHERE c.id IS NOT NULL AND c.is_active = true
                    AND (
                        p.level = 'national'
                        OR (p.level = 'county'
                            AND ($2::int IS NULL OR c.county_id IS NULL OR c.county_id = $2::int))
                        OR (p.level = 'constituency'
                            AND ($3::int IS NULL OR c.constituency_id IS NULL OR c.constituency_id = $3::int))
                        OR (p.level = 'ward'
                            AND ($4::int IS NULL OR c.ward_id IS NULL OR c.ward_id = $4::int))
                    )
                ),
                '[]'
            ) AS candidates
         FROM positions p
         LEFT JOIN candidates c
            ON c.position_id = p.id
           AND c.election_id = $1
         WHERE p.election_id = $1
         GROUP BY p.id, p.name, p.description, p.display_order, p.level
         ORDER BY p.display_order`,
        [electionId, countyId ? parseInt(countyId) : null,
                     constituencyId ? parseInt(constituencyId) : null,
                     wardId ? parseInt(wardId) : null]
    );
    return result.rows;
}

// ── GET /api/elections/:id/positions ──────────────────────────
const getPositions = async (req, res) => {
    const { id } = req.params;
    const { countyId, constituencyId, wardId } = req.query;
    try {
        const positions = await getPositionsWithCandidates(id, { countyId, constituencyId, wardId });
        res.json({ success: true, positions });
    } catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const createElection = async (req, res) => {
    const { name, description, startDate, endDate } = req.body;
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'name, startDate, and endDate are required.' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ success: false, error: 'startDate must be before endDate.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO elections (name, description, status, start_date, end_date)
             VALUES ($1, $2, 'pending', $3, $4) RETURNING *`,
            [name, description || null, startDate, endDate]
        );
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'ELECTION_CREATED', `Election "${name}" created`]
        );
        res.status(201).json({ success: true, election: result.rows[0] });
    } catch (error) {
        console.error('Create election error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const updateElectionStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'closed', 'results_published'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    try {
        const result = await pool.query(
            `UPDATE elections SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found.' });
        }
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'ELECTION_STATUS_UPDATED', `Election ${id} status changed to ${status}`]
        );
        res.json({ success: true, election: result.rows[0] });
    } catch (error) {
        console.error('Update election status error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const getElectionResults = async (req, res) => {
    const { id } = req.params;
    try {
        const electionResult = await pool.query('SELECT * FROM elections WHERE id = $1', [id]);
        if (electionResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found.' });
        }
        const election = electionResult.rows[0];
        const isAdmin = req.user && ['admin', 'iebc_official'].includes(req.user.role);
        if (election.status !== 'results_published' && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Results are not yet published.' });
        }

        // Results grouped by position
        const results = await pool.query(
            `SELECT
                p.name        AS position,
                c.name        AS candidate,
                c.symbol      AS party,
                COUNT(v.id)   AS vote_count
             FROM positions p
             JOIN candidates c ON c.position_id = p.id
             LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = $1
             WHERE p.election_id = $1
             GROUP BY p.id, p.name, p.display_order, c.id, c.name, c.symbol
             ORDER BY p.display_order, vote_count DESC`,
            [id]
        );

        // Group by position name
        const grouped = {};
        results.rows.forEach(row => {
            if (!grouped[row.position]) grouped[row.position] = [];
            grouped[row.position].push({
                candidate: row.candidate,
                party: row.party,
                votes: parseInt(row.vote_count)
            });
        });

        const turnoutResult = await pool.query(
            `SELECT COUNT(DISTINCT voter_id) as total_votes FROM votes WHERE election_id = $1`, [id]
        );
        const registeredResult = await pool.query(`SELECT COUNT(*) as total FROM voters`);

        res.json({
            success: true,
            election: { id: election.id, name: election.name, status: election.status },
            results: grouped,
            turnout: {
                voted: parseInt(turnoutResult.rows[0].total_votes),
                registered: parseInt(registeredResult.rows[0].total)
            }
        });
    } catch (error) {
        console.error('Get election results error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

const addCandidate = async (req, res) => {
    const { electionId, positionId } = req.params;
    const { name, party, description } = req.body;
    if (!name || !party) {
        return res.status(400).json({ success: false, error: 'Candidate name and party are required.' });
    }
    try {
        const posCheck = await pool.query(
            'SELECT id FROM positions WHERE id = $1 AND election_id = $2',
            [positionId, electionId]
        );
        if (posCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Position does not belong to this election.' });
        }
        // symbol column stores party name in your schema
        const result = await pool.query(
            `INSERT INTO candidates (election_id, position_id, name, symbol, description, is_active)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
            [electionId, positionId, name, party, description || null]
        );
        res.status(201).json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        console.error('Add candidate error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

module.exports = {
    getAllElections,
    getActiveElection,
    getElectionById,
    createElection,
    updateElectionStatus,
    getElectionResults,
    getPositions,
    addCandidate
};