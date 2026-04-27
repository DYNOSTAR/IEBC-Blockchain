const pool = require('../config/db');
const Election = require('../models/Election');

// Get all elections
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

// Get active election with positions and candidates
const getActiveElection = async (req, res) => {
    try {
        const election = await Election.getActiveElection();
        if (!election) {
            return res.status(404).json({ success: false, error: 'No active election found.' });
        }

        const positions = await Election.getPositionsWithCandidates(election.id);
        res.json({ success: true, election: { ...election, positions } });

    } catch (error) {
        console.error('Get active election error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Get single election by ID
const getElectionById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM elections WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found.' });
        }

        const positions = await Election.getPositionsWithCandidates(id);
        res.json({ success: true, election: { ...result.rows[0], positions } });

    } catch (error) {
        console.error('Get election by ID error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Create election (admin only)
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

// Update election status (admin only)
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

// Get election results (public after results_published, admin any time)
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

        const results = await Election.getResults(id);

        // Get total voter turnout
        const turnoutResult = await pool.query(
            `SELECT COUNT(DISTINCT voter_id) as total_votes FROM votes WHERE election_id = $1`,
            [id]
        );
        const registeredResult = await pool.query(`SELECT COUNT(*) as total FROM voters`);

        res.json({
            success: true,
            election: { id: election.id, name: election.name, status: election.status },
            results,
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

// Get positions for an election
const getPositions = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, COUNT(c.id) as candidate_count
             FROM positions p
             LEFT JOIN candidates c ON p.id = c.position_id
             WHERE p.election_id = $1
             GROUP BY p.id
             ORDER BY p.display_order`,
            [id]
        );
        res.json({ success: true, positions: result.rows });
    } catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Add candidate to election position (admin only)
const addCandidate = async (req, res) => {
    const { electionId, positionId } = req.params;
    const { name, party, biography, photoUrl } = req.body;

    if (!name || !party) {
        return res.status(400).json({ success: false, error: 'Candidate name and party are required.' });
    }

    try {
        // Verify position belongs to election
        const posCheck = await pool.query(
            'SELECT id FROM positions WHERE id = $1 AND election_id = $2',
            [positionId, electionId]
        );
        if (posCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Position does not belong to this election.' });
        }

        const result = await pool.query(
            `INSERT INTO candidates (name, party, biography, photo_url, position_id, election_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, party, biography || null, photoUrl || null, positionId, electionId]
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