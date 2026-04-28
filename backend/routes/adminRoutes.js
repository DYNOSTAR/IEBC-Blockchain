const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticate, isAdmin);

// ============ COUNTIES (47) ============
router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM counties ORDER BY code');
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/counties', async (req, res) => {
    const { name, code, headquarters, population } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO counties (name, code, headquarters, population) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, code, headquarters, population]
        );
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ CONSTITUENCIES (290) ============
router.get('/constituencies', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, ct.name as county_name 
            FROM constituencies c
            JOIN counties ct ON c.county_id = ct.id
            ORDER BY ct.name, c.name
        `);
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/constituencies', async (req, res) => {
    const { name, code, county_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO constituencies (name, code, county_id) VALUES ($1, $2, $3) RETURNING *',
            [name, code, county_id]
        );
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ WARDS ============
router.get('/wards', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.*, c.name as constituency_name, ct.name as county_name
            FROM wards w
            JOIN constituencies c ON w.constituency_id = c.id
            JOIN counties ct ON c.county_id = ct.id
            ORDER BY ct.name, c.name, w.name
        `);
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/wards', async (req, res) => {
    const { name, code, constituency_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO wards (name, code, constituency_id) VALUES ($1, $2, $3) RETURNING *',
            [name, code, constituency_id]
        );
        res.json({ success: true, ward: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ POLLING STATIONS ============
router.get('/polling-stations', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ps.*, w.name as ward_name, c.name as constituency_name
            FROM polling_stations ps
            JOIN wards w ON ps.ward_id = w.id
            JOIN constituencies c ON w.constituency_id = c.id
            ORDER BY c.name, w.name, ps.name
        `);
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/polling-stations', async (req, res) => {
    const { name, code, ward_id, location } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO polling_stations (name, code, ward_id, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, code, ward_id, location]
        );
        res.json({ success: true, pollingStation: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ POLITICAL PARTIES ============
router.get('/parties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM parties ORDER BY name');
        res.json({ success: true, parties: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/parties', async (req, res) => {
    const { name, code, symbol, color, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO parties (name, code, symbol, color, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, code, symbol, color, description]
        );
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ CANDIDATES ============
router.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.name as party_name, pos.title as position_name, e.name as election_name
            FROM candidates c
            JOIN parties p ON c.party_id = p.id
            JOIN positions pos ON c.position_id = pos.id
            JOIN elections e ON c.election_id = e.id
            ORDER BY e.name, pos.display_order, c.name
        `);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/candidates', async (req, res) => {
    const { name, party_id, position_id, election_id, county_id, description, symbol } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO candidates (name, party_id, position_id, election_id, county_id, description, symbol) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, party_id, position_id, election_id, county_id || null, description, symbol]
        );
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ ELECTIONS ============
router.get('/elections', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM elections ORDER BY start_date DESC');
        res.json({ success: true, elections: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/elections', async (req, res) => {
    const { name, description, start_date, end_date, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO elections (name, description, start_date, end_date, status) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, description, start_date, end_date, status || 'upcoming']
        );
        res.json({ success: true, election: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ VOTERS ============
router.get('/voters', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT v.*, u.first_name, u.last_name, u.email, u.phone, c.name as county_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            ORDER BY u.last_name
        `);
        res.json({ success: true, voters: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;