const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticate, isAdmin);

// ============================================
// COUNTIES MANAGEMENT
// ============================================

// Get all counties
router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, code, headquarters, population, registered_voters
            FROM counties ORDER BY code
        `);
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new county
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
        console.error('Error creating county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update county
router.put('/counties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, headquarters, population } = req.body;
    try {
        const result = await pool.query(
            `UPDATE counties SET name=$1, code=$2, headquarters=$3, population=$4, updated_at=NOW()
             WHERE id=$5 RETURNING *`,
            [name, code, headquarters, population, id]
        );
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        console.error('Error updating county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete county
router.delete('/counties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM counties WHERE id=$1', [id]);
        res.json({ success: true, message: 'County deleted' });
    } catch (error) {
        console.error('Error deleting county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CONSTITUENCIES MANAGEMENT
// ============================================

// Get all constituencies
router.get('/constituencies', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, ct.name as county_name, ct.code as county_code
            FROM constituencies c
            LEFT JOIN counties ct ON c.county_id = ct.id
            ORDER BY ct.name, c.name
        `);
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get constituencies by county
router.get('/constituencies/county/:countyId', async (req, res) => {
    const { countyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name`,
            [countyId]
        );
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies by county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new constituency
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
        console.error('Error creating constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update constituency
router.put('/constituencies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, county_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE constituencies SET name=$1, code=$2, county_id=$3, updated_at=NOW()
             WHERE id=$4 RETURNING *`,
            [name, code, county_id, id]
        );
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        console.error('Error updating constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete constituency
router.delete('/constituencies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM constituencies WHERE id=$1', [id]);
        res.json({ success: true, message: 'Constituency deleted' });
    } catch (error) {
        console.error('Error deleting constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WARDS MANAGEMENT
// ============================================

// Get all wards
router.get('/wards', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT w.*, c.name as constituency_name, ct.name as county_name
            FROM wards w
            LEFT JOIN constituencies c ON w.constituency_id = c.id
            LEFT JOIN counties ct ON c.county_id = ct.id
            ORDER BY ct.name, c.name, w.name
        `);
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get wards by constituency
router.get('/wards/constituency/:constituencyId', async (req, res) => {
    const { constituencyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name`,
            [constituencyId]
        );
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards by constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new ward
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
        console.error('Error creating ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update ward
router.put('/wards/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, constituency_id, county_id } = req.body;
    try {
        const result = await pool.query(
            `UPDATE wards SET name=$1, code=$2, constituency_id=$3, county_id=$4, updated_at=NOW()
             WHERE id=$5 RETURNING *`,
            [name, code, constituency_id, county_id, id]
        );
        res.json({ success: true, ward: result.rows[0] });
    } catch (error) {
        console.error('Error updating ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete ward
router.delete('/wards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM wards WHERE id=$1', [id]);
        res.json({ success: true, message: 'Ward deleted' });
    } catch (error) {
        console.error('Error deleting ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POLITICAL PARTIES MANAGEMENT
// ============================================

// Get all political parties
router.get('/parties', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM political_parties ORDER BY name');
        res.json({ success: true, parties: result.rows });
    } catch (error) {
        console.error('Error fetching parties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new political party
router.post('/parties', async (req, res) => {
    const { name, code, symbol, color, slogan } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO political_parties (name, code, symbol, color, slogan)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, code, symbol, color, slogan]
        );
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        console.error('Error creating party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update political party
router.put('/parties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, symbol, color, slogan, is_active } = req.body;
    try {
        const result = await pool.query(
            `UPDATE political_parties 
             SET name=$1, code=$2, symbol=$3, color=$4, slogan=$5, is_active=$6, updated_at=NOW()
             WHERE id=$7 RETURNING *`,
            [name, code, symbol, color, slogan, is_active, id]
        );
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        console.error('Error updating party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete political party
router.delete('/parties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM political_parties WHERE id=$1', [id]);
        res.json({ success: true, message: 'Party deleted' });
    } catch (error) {
        console.error('Error deleting party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CANDIDATES MANAGEMENT
// ============================================

// Get all candidates
// ============================================
// CANDIDATES MANAGEMENT - FIXED
// ============================================

// Get all candidates
router.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   p.name as party_name, p.symbol as party_symbol, p.color as party_color,
                   pos.name as position_name, pos.level as position_level,
                   e.name as election_name,
                   co.name as county_name,
                   con.name as constituency_name,
                   w.name as ward_name
            FROM candidates c
            LEFT JOIN political_parties p ON c.political_party_id = p.id
            LEFT JOIN positions pos ON c.position_id = pos.id
            LEFT JOIN elections e ON c.election_id = e.id
            LEFT JOIN counties co ON c.county_id = co.id
            LEFT JOIN constituencies con ON c.constituency_id = con.id
            LEFT JOIN wards w ON c.ward_id = w.id
            ORDER BY e.name, pos.display_order, c.name
        `);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new candidate
router.post('/candidates', async (req, res) => {
    const { 
        election_id, position_id, political_party_id, name, 
        symbol, description, county_id, constituency_id, ward_id, is_independent 
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO candidates (election_id, position_id, political_party_id, name, 
                                     symbol, description, county_id, constituency_id, ward_id, is_independent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [election_id, position_id, political_party_id, name, symbol, description, county_id, constituency_id, ward_id, is_independent || false]
        );
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        console.error('Error creating candidate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update candidate
router.put('/candidates/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        election_id, position_id, political_party_id, name, 
        symbol, description, county_id, constituency_id, ward_id, is_independent 
    } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE candidates 
             SET election_id=$1, position_id=$2, political_party_id=$3, name=$4,
                 symbol=$5, description=$6, county_id=$7, constituency_id=$8, 
                 ward_id=$9, is_independent=$10, updated_at=NOW()
             WHERE id=$11
             RETURNING *`,
            [election_id, position_id, political_party_id, name, symbol, description, 
             county_id, constituency_id, ward_id, is_independent || false, id]
        );
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        console.error('Error updating candidate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete candidate
router.delete('/candidates/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM candidates WHERE id = $1', [id]);
        res.json({ success: true, message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Error deleting candidate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// VOTERS MANAGEMENT
// ============================================

// Get all voters
router.get('/voters', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.national_id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.created_at as registered_at,
                v.id as voter_id,
                v.has_voted,
                v.county_id,
                v.constituency_id,
                v.ward_id,
                v.id_card_image,
                v.face_image,
                v.is_verified,
                c.name as county_name,
                con.name as constituency_name,
                w.name as ward_name
            FROM users u
            LEFT JOIN voters v ON u.id = v.user_id
            LEFT JOIN counties c ON v.county_id = c.id
            LEFT JOIN constituencies con ON v.constituency_id = con.id
            LEFT JOIN wards w ON v.ward_id = w.id
            WHERE u.role = 'voter'
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, voters: result.rows });
    } catch (error) {
        console.error('Error fetching voters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ELECTIONS MANAGEMENT
// ============================================

// Get all elections
router.get('/elections', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM elections ORDER BY start_date DESC
        `);
        res.json({ success: true, elections: result.rows });
    } catch (error) {
        console.error('Error fetching elections:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new election
router.post('/elections', async (req, res) => {
    const { name, description, start_date, end_date, registration_start, registration_end, status } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO elections (name, description, start_date, end_date, registration_start, registration_end, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, description, start_date, end_date, registration_start, registration_end, status || 'upcoming']
        );
        res.json({ success: true, election: result.rows[0] });
    } catch (error) {
        console.error('Error creating election:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update election status
router.put('/elections/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            `UPDATE elections SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, id]
        );
        res.json({ success: true, election: result.rows[0] });
    } catch (error) {
        console.error('Error updating election status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POSITIONS - FIXED
// ============================================

// Get all positions
router.get('/positions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name as title, description, display_order, level
            FROM positions ORDER BY display_order
        `);
        res.json({ success: true, positions: result.rows });
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// REPORTS MANAGEMENT
// ============================================

// Get all reports
router.get('/reports', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.national_id
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, reports: result.rows });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update report status
router.put('/reports/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    try {
        const result = await pool.query(
            `UPDATE reports 
             SET status = $1, resolution_notes = $2, updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, resolution_notes, id]
        );
        res.json({ success: true, report: result.rows[0] });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUDIT LOGS
// ============================================

// Get audit logs
router.get('/audit-logs', async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    try {
        const result = await pool.query(`
            SELECT al.*, u.first_name, u.last_name, u.email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        const count = await pool.query('SELECT COUNT(*) FROM audit_logs');
        
        res.json({ 
            success: true, 
            auditLogs: result.rows,
            total: parseInt(count.rows[0].count)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;