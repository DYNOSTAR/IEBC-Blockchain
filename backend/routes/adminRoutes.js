const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, isAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticate, isAdmin);

// ============================================
// ADMIN PROFILE
// ============================================

// Get admin profile
router.get('/profile', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.national_id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active, u.created_at,
                   ap.department, ap.position, ap.employee_id
            FROM users u
            LEFT JOIN admin_profiles ap ON u.id = ap.user_id
            WHERE u.id = $1 AND u.role IN ('admin', 'iebc_official', 'super_admin')
        `, [req.user.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }
        
        res.json({ success: true, admin: result.rows[0] });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update admin profile
router.put('/profile', async (req, res) => {
    const { first_name, last_name, email, phone, department, position } = req.body;
    try {
        await pool.query(
            `UPDATE users SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = NOW()
             WHERE id = $5`,
            [first_name, last_name, email, phone, req.user.id]
        );
        
        await pool.query(
            `INSERT INTO admin_profiles (user_id, department, position, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id) DO UPDATE SET department = $2, position = $3, updated_at = NOW()`,
            [req.user.id, department, position]
        );
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// COUNTIES MANAGEMENT
// ============================================

// Get all counties
router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, code, population, registered_voters, headquarters, created_at
            FROM counties
            ORDER BY code
        `);
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get single county
router.get('/counties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code, population, registered_voters, headquarters
             FROM counties WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'County not found' });
        }
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        console.error('Error fetching county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new county
router.post('/counties', async (req, res) => {
    const { name, code, population, registered_voters, headquarters } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO counties (name, code, population, registered_voters, headquarters)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, code, population || 0, registered_voters || 0, headquarters || null]
        );
        
        // Log action
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'CREATE_COUNTY', 'county', result.rows[0].id, `Created county: ${name}`]
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
    const { name, code, population, registered_voters, headquarters } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE counties 
             SET name = $1, code = $2, population = $3, registered_voters = $4, headquarters = $5, updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, code, population || 0, registered_voters || 0, headquarters || null, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'County not found' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'UPDATE_COUNTY', 'county', id, `Updated county: ${name}`]
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
        // Check if county has constituencies
        const checkResult = await pool.query(
            'SELECT COUNT(*) as count FROM constituencies WHERE county_id = $1',
            [id]
        );
        
        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete county with existing constituencies. Delete constituencies first.' 
            });
        }
        
        const result = await pool.query('DELETE FROM counties WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'County not found' });
        }
        
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'DELETE_COUNTY', 'county', id, `Deleted county`]
        );
        
        res.json({ success: true, message: 'County deleted successfully' });
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
            SELECT con.*, c.name as county_name, c.code as county_code
            FROM constituencies con
            JOIN counties c ON con.county_id = c.id
            ORDER BY c.name, con.name
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
            `SELECT * FROM constituencies WHERE county_id = $1 ORDER BY name`,
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
    
    if (!name || !code || !county_id) {
        return res.status(400).json({ success: false, error: 'Name, code, and county are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO constituencies (name, code, county_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, code, county_id]
        );
        
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [req.user.id, 'CREATE_CONSTITUENCY', 'constituency', result.rows[0].id, `Created constituency: ${name}`]
        );
        
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        console.error('Error creating constituency:', error);
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
            SELECT w.*, con.name as constituency_name, c.name as county_name
            FROM wards w
            JOIN constituencies con ON w.constituency_id = con.id
            JOIN counties c ON con.county_id = c.id
            ORDER BY c.name, con.name, w.name
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
            `SELECT * FROM wards WHERE constituency_id = $1 ORDER BY name`,
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
    const { name, code, constituency_id } = req.body;
    
    if (!name || !constituency_id) {
        return res.status(400).json({ success: false, error: 'Name and constituency are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO wards (name, code, constituency_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, code || null, constituency_id]
        );
        
        res.json({ success: true, ward: result.rows[0] });
    } catch (error) {
        console.error('Error creating ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POLLING STATIONS MANAGEMENT
// ============================================

// Get all polling stations
router.get('/polling-stations', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ps.*, w.name as ward_name, con.name as constituency_name, c.name as county_name
            FROM polling_stations ps
            JOIN wards w ON ps.ward_id = w.id
            JOIN constituencies con ON w.constituency_id = con.id
            JOIN counties c ON con.county_id = c.id
            ORDER BY c.name, con.name, w.name, ps.name
        `);
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        console.error('Error fetching polling stations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get polling stations by ward
router.get('/polling-stations/ward/:wardId', async (req, res) => {
    const { wardId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM polling_stations WHERE ward_id = $1 ORDER BY name`,
            [wardId]
        );
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        console.error('Error fetching polling stations by ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new polling station
router.post('/polling-stations', async (req, res) => {
    const { name, code, ward_id, location, capacity } = req.body;
    
    if (!name || !code || !ward_id) {
        return res.status(400).json({ success: false, error: 'Name, code, and ward are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO polling_stations (name, code, ward_id, location, capacity)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, code, ward_id, location || null, capacity || null]
        );
        
        res.json({ success: true, pollingStation: result.rows[0] });
    } catch (error) {
        console.error('Error creating polling station:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POLITICAL PARTIES MANAGEMENT
// ============================================

// Get all political parties
router.get('/parties', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM political_parties ORDER BY name
        `);
        res.json({ success: true, parties: result.rows });
    } catch (error) {
        console.error('Error fetching parties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new political party
router.post('/parties', async (req, res) => {
    const { name, code, symbol, color, slogan } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO political_parties (name, code, symbol, color, slogan)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, code, symbol || null, color || null, slogan || null]
        );
        
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        console.error('Error creating party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CANDIDATES MANAGEMENT
// ============================================

// Get all candidates
router.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, p.name as party_name, pos.title as position_name, e.name as election_name
            FROM candidates c
            LEFT JOIN political_parties p ON c.political_party_id = p.id
            LEFT JOIN positions pos ON c.position_id = pos.id
            LEFT JOIN elections e ON c.election_id = e.id
            ORDER BY c.name
        `);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new candidate
router.post('/candidates', async (req, res) => {
    const { name, political_party_id, position_id, election_id, description, symbol, county_id } = req.body;
    
    if (!name || !position_id || !election_id) {
        return res.status(400).json({ success: false, error: 'Name, position, and election are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO candidates (name, political_party_id, position_id, election_id, description, symbol, county_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, political_party_id || null, position_id, election_id, description || null, symbol || null, county_id || null]
        );
        
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        console.error('Error creating candidate:', error);
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
    
    if (!name || !start_date || !end_date) {
        return res.status(400).json({ success: false, error: 'Name, start date, and end date are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO elections (name, description, start_date, end_date, registration_start, registration_end, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, description || null, start_date, end_date, registration_start || null, registration_end || null, status || 'upcoming', req.user.id]
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
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Election not found' });
        }
        
        res.json({ success: true, election: result.rows[0] });
    } catch (error) {
        console.error('Error updating election status:', error);
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
            SELECT v.*, u.first_name, u.last_name, u.email, u.phone, u.created_at as registered_date
            FROM voters v
            JOIN users u ON v.user_id = u.id
            ORDER BY u.last_name
        `);
        res.json({ success: true, voters: result.rows });
    } catch (error) {
        console.error('Error fetching voters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POSITIONS
// ============================================

// Get all positions
router.get('/positions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM positions ORDER BY display_order
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
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }
        
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