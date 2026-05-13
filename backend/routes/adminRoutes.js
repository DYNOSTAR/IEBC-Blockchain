const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate, isAdmin);

// ============================================
// COUNTIES (Simple CRUD)
// ============================================

router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, code, headquarters, population, registered_voters
            FROM counties ORDER BY code
        `);
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/counties', async (req, res) => {
    const { name, code, headquarters, population } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO counties (name, code, headquarters, population)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, code, headquarters, population]
        );
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/counties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, headquarters, population } = req.body;
    try {
        const result = await pool.query(
            `UPDATE counties SET name=$1, code=$2, headquarters=$3, population=$4
             WHERE id=$5 RETURNING *`,
            [name, code, headquarters, population, id]
        );
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/counties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM counties WHERE id=$1', [id]);
        res.json({ success: true, message: 'County deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CONSTITUENCIES (Simple CRUD - No foreign key)
// ============================================

router.get('/constituencies', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, ct.name as county_name
            FROM constituencies c
            LEFT JOIN counties ct ON c.county_id = ct.id
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
            `INSERT INTO constituencies (name, code, county_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [name, code, county_id]
        );
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/constituencies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM constituencies WHERE id=$1', [id]);
        res.json({ success: true, message: 'Constituency deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WARDS (Simple CRUD - No foreign key)
// ============================================

router.get('/wards', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.*, c.name as constituency_name, ct.name as county_name
            FROM wards w
            LEFT JOIN constituencies c ON w.constituency_id = c.id
            LEFT JOIN counties ct ON w.county_id = ct.id
            ORDER BY ct.name, c.name, w.name
        `);
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/wards', async (req, res) => {
    const { name, code, constituency_id, county_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO wards (name, code, constituency_id, county_id)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, code, constituency_id, county_id]
        );
        res.json({ success: true, ward: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/wards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM wards WHERE id=$1', [id]);
        res.json({ success: true, message: 'Ward deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POLITICAL PARTIES
// ============================================

router.get('/parties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM political_parties ORDER BY name');
        res.json({ success: true, parties: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/parties', async (req, res) => {
    const { name, code, symbol, color } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO political_parties (name, code, symbol, color)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, code, symbol, color]
        );
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CANDIDATES (With location logic)
// ============================================

router.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.name as party_name, p.symbol as party_symbol,
                   pos.name as position_name, pos.level as position_level
            FROM candidates c
            LEFT JOIN political_parties p ON c.political_party_id = p.id
            LEFT JOIN positions pos ON c.position_id = pos.id
            ORDER BY pos.display_order, c.name
        `);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/candidates', async (req, res) => {
    const { 
        position_id, political_party_id, name, running_mate, 
        symbol, description, location_id, location_type, is_independent 
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO candidates (election_id, position_id, political_party_id, name, 
                                     running_mate, symbol, description, location_id, location_type, is_independent)
             VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [position_id, political_party_id, name, running_mate, symbol, description, location_id, location_type, is_independent || false]
        );
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;