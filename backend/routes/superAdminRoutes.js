const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

// Apply super admin authentication to all routes
router.use(authenticate, isSuperAdmin);

// ============================================
// TEST ROUTE - Check if routes are working
// ============================================
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Super Admin routes are working!' });
});

// ============================================
// COUNTIES MANAGEMENT (Super Admin)
// ============================================

router.get('/counties', async (req, res) => {
    try {
        console.log('Fetching counties for Super Admin...');
        const result = await pool.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT con.id) as constituency_count,
                COUNT(DISTINCT w.id) as ward_count
            FROM counties c
            LEFT JOIN constituencies con ON c.id = con.county_id
            LEFT JOIN wards w ON con.id = w.constituency_id
            GROUP BY c.id
            ORDER BY c.code
        `);
        
        console.log(`Found ${result.rows.length} counties`);
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/counties', async (req, res) => {
    const { name, code, headquarters, population, registered_voters } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO counties (name, code, headquarters, population, registered_voters)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [name, code.toUpperCase(), headquarters, population || 0, registered_voters || 0]
        );
        
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        console.error('Error creating county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/counties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, headquarters, population, registered_voters } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE counties 
             SET name = $1, code = $2, headquarters = $3, population = $4, registered_voters = $5, updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, code, headquarters, population || 0, registered_voters || 0, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'County not found' });
        }
        
        res.json({ success: true, county: result.rows[0] });
    } catch (error) {
        console.error('Error updating county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/counties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM counties WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'County not found' });
        }
        
        res.json({ success: true, message: 'County deleted successfully' });
    } catch (error) {
        console.error('Error deleting county:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CONSTITUENCIES MANAGEMENT (Super Admin)
// ============================================

router.get('/constituencies', async (req, res) => {
    try {
        console.log('Fetching constituencies for Super Admin...');
        const result = await pool.query(`
            SELECT 
                con.*,
                c.name as county_name,
                c.code as county_code,
                COUNT(DISTINCT w.id) as ward_count
            FROM constituencies con
            LEFT JOIN counties c ON con.county_id = c.id
            LEFT JOIN wards w ON con.id = w.constituency_id
            GROUP BY con.id, c.name, c.code
            ORDER BY c.name, con.name
        `);
        
        console.log(`Found ${result.rows.length} constituencies`);
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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
        
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        console.error('Error creating constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/constituencies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, county_id } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE constituencies 
             SET name = $1, code = $2, county_id = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [name, code, county_id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Constituency not found' });
        }
        
        res.json({ success: true, constituency: result.rows[0] });
    } catch (error) {
        console.error('Error updating constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/constituencies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM constituencies WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Constituency not found' });
        }
        
        res.json({ success: true, message: 'Constituency deleted successfully' });
    } catch (error) {
        console.error('Error deleting constituency:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WARDS MANAGEMENT (Super Admin)
// ============================================

router.get('/wards', async (req, res) => {
    try {
        console.log('Fetching wards for Super Admin...');
        const result = await pool.query(`
            SELECT 
                w.*,
                con.name as constituency_name,
                c.name as county_name
            FROM wards w
            LEFT JOIN constituencies con ON w.constituency_id = con.id
            LEFT JOIN counties c ON con.county_id = c.id
            ORDER BY c.name, con.name, w.name
        `);
        
        console.log(`Found ${result.rows.length} wards`);
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

router.put('/wards/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, constituency_id } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE wards 
             SET name = $1, code = $2, constituency_id = $3, updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [name, code, constituency_id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ward not found' });
        }
        
        res.json({ success: true, ward: result.rows[0] });
    } catch (error) {
        console.error('Error updating ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/wards/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM wards WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ward not found' });
        }
        
        res.json({ success: true, message: 'Ward deleted successfully' });
    } catch (error) {
        console.error('Error deleting ward:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POLITICAL PARTIES MANAGEMENT (Super Admin)
// ============================================

router.get('/parties', async (req, res) => {
    try {
        console.log('Fetching political parties for Super Admin...');
        const result = await pool.query(`
            SELECT p.*, 
                   COUNT(DISTINCT c.id) as candidate_count
            FROM political_parties p
            LEFT JOIN candidates c ON p.id = c.political_party_id
            GROUP BY p.id
            ORDER BY p.name
        `);
        
        console.log(`Found ${result.rows.length} political parties`);
        res.json({ success: true, parties: result.rows });
    } catch (error) {
        console.error('Error fetching parties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/parties', async (req, res) => {
    const { name, code, symbol, color, slogan, website, email, phone, headquarters, registration_date, is_active } = req.body;
    
    if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Party name and code are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO political_parties (name, code, symbol, color, slogan, website, email, phone, headquarters, registration_date, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [name, code.toUpperCase(), symbol, color, slogan, website, email, phone, headquarters, registration_date, is_active !== false]
        );
        
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        console.error('Error creating party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/parties/:id', async (req, res) => {
    const { id } = req.params;
    const { name, code, symbol, color, slogan, website, email, phone, headquarters, registration_date, is_active } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE political_parties 
             SET name = $1, code = $2, symbol = $3, color = $4, slogan = $5, 
                 website = $6, email = $7, phone = $8, headquarters = $9, 
                 registration_date = $10, is_active = $11, updated_at = NOW()
             WHERE id = $12
             RETURNING *`,
            [name, code, symbol, color, slogan, website, email, phone, headquarters, registration_date, is_active, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Party not found' });
        }
        
        res.json({ success: true, party: result.rows[0] });
    } catch (error) {
        console.error('Error updating party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/parties/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if party has candidates
        const candidateCheck = await pool.query('SELECT COUNT(*) FROM candidates WHERE political_party_id = $1', [id]);
        const candidateCount = parseInt(candidateCheck.rows[0].count);
        
        if (candidateCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot delete party. It has ${candidateCount} candidates. Reassign or delete them first.` 
            });
        }
        
        const result = await pool.query('DELETE FROM political_parties WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Party not found' });
        }
        
        res.json({ success: true, message: 'Party deleted successfully' });
    } catch (error) {
        console.error('Error deleting party:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// STATISTICS
// ============================================

router.get('/statistics', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'iebc_official')) as total_admins,
                (SELECT COUNT(*) FROM users WHERE role = 'voter') as total_voters,
                (SELECT COUNT(*) FROM counties) as total_counties,
                (SELECT COUNT(*) FROM constituencies) as total_constituencies,
                (SELECT COUNT(*) FROM wards) as total_wards,
                (SELECT COUNT(*) FROM political_parties) as total_parties,
                (SELECT COUNT(*) FROM candidates) as total_candidates,
                (SELECT COUNT(*) FROM votes) as total_votes_cast,
                (SELECT COUNT(*) FROM reports) as total_reports,
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports
        `);
        
        res.json({ success: true, statistics: stats.rows[0] });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ADMIN MANAGEMENT
// ============================================

router.get('/admins', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.national_id, u.first_name, u.last_name, u.email, u.phone, 
                   u.role, u.is_active, u.created_at, u.last_login,
                   ap.department, ap.position
            FROM users u
            LEFT JOIN admin_profiles ap ON u.id = ap.user_id
            WHERE u.role IN ('admin', 'iebc_official')
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, admins: result.rows });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/admins', async (req, res) => {
    const { national_id, first_name, last_name, email, phone, role, password, department, position } = req.body;
    
    try {
        const existing = await pool.query('SELECT id FROM users WHERE national_id = $1', [national_id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'National ID already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userResult = await pool.query(
            `INSERT INTO users (national_id, first_name, last_name, email, phone, password_hash, role, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING id`,
            [national_id, first_name, last_name, email, phone, hashedPassword, role, true]
        );
        
        await pool.query(
            `INSERT INTO admin_profiles (user_id, department, position, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [userResult.rows[0].id, department, position]
        );
        
        res.json({ success: true, message: 'Admin created successfully' });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/admins/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM admin_profiles WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUDIT LOGS
// ============================================

router.get('/audit-logs', async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    try {
        const result = await pool.query(`
            SELECT al.*, u.first_name, u.last_name, u.email
            FROM admin_audit_logs al
            LEFT JOIN users u ON al.admin_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        res.json({ success: true, auditLogs: result.rows });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POSITIONS (Super Admin)
// ============================================

router.get('/positions', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, level, display_order FROM positions ORDER BY display_order
        `);
        res.json({ success: true, positions: result.rows });
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ELECTIONS (Super Admin)
// ============================================

router.get('/elections', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, status FROM elections ORDER BY start_date DESC
        `);
        res.json({ success: true, elections: result.rows });
    } catch (error) {
        console.error('Error fetching elections:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CONSTITUENCIES BY COUNTY (Super Admin)
// ============================================

router.get('/constituencies/by-county/:countyId', async (req, res) => {
    const { countyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name`,
            [countyId]
        );
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// WARDS BY CONSTITUENCY (Super Admin)
// ============================================

router.get('/wards/by-constituency/:constituencyId', async (req, res) => {
    const { constituencyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name`,
            [constituencyId]
        );
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CANDIDATES MANAGEMENT (Super Admin)
// ============================================

// Get all candidates
router.get('/candidates', async (req, res) => {
    try {
        console.log('Fetching candidates for Super Admin...');
        
        const result = await pool.query(`
            SELECT 
                c.*,
                p.name as party_name,
                p.color as party_color,
                pos.name as position_name,
                pos.level as position_level,
                e.name as election_name,
                ct.name as county_name,
                con.name as constituency_name,
                w.name as ward_name
            FROM candidates c
            LEFT JOIN political_parties p ON c.political_party_id = p.id
            LEFT JOIN positions pos ON c.position_id = pos.id
            LEFT JOIN elections e ON c.election_id = e.id
            LEFT JOIN counties ct ON c.county_id = ct.id
            LEFT JOIN constituencies con ON c.constituency_id = con.id
            LEFT JOIN wards w ON c.ward_id = w.id
            ORDER BY c.id DESC
        `);
        
        console.log(`Found ${result.rows.length} candidates`);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add new candidate
router.post('/candidates', async (req, res) => {
    const { 
        election_id, position_id, political_party_id, name, running_mate,
        symbol, description, county_id, constituency_id, ward_id, is_independent 
    } = req.body;
    
    if (!position_id || !name) {
        return res.status(400).json({ success: false, error: 'Position and name are required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO candidates (election_id, position_id, political_party_id, name, running_mate,
                                     symbol, description, county_id, constituency_id, ward_id, is_independent)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [election_id || 1, position_id, political_party_id || null, name, running_mate || null,
             symbol || null, description || null, county_id || null, constituency_id || null, ward_id || null, is_independent || false]
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
        position_id, political_party_id, name, running_mate,
        symbol, description, county_id, constituency_id, ward_id, is_independent 
    } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE candidates 
             SET position_id = $1, political_party_id = $2, name = $3, 
                 running_mate = $4, symbol = $5, description = $6, county_id = $7, 
                 constituency_id = $8, ward_id = $9, is_independent = $10, updated_at = NOW()
             WHERE id = $11
             RETURNING *`,
            [position_id, political_party_id || null, name, running_mate || null,
             symbol || null, description || null, county_id || null, constituency_id || null, 
             ward_id || null, is_independent || false, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }
        
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
        const result = await pool.query('DELETE FROM candidates WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }
        
        res.json({ success: true, message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('Error deleting candidate:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// VOTERS DATA MANAGEMENT (Super Admin) - COMPLETE
// ============================================

router.get('/voters', async (req, res) => {
    try {
        console.log('Fetching voters data for Super Admin...');
        
        const result = await pool.query(`
            SELECT 
                v.id,
                v.user_id,
                v.national_id,
                v.has_voted,
                v.is_verified,
                v.verification_level,
                v.registered_at,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.created_at,
                u.last_login,
                v.county_id,
                v.constituency_id,
                v.ward_id,
                c.name as county_name,
                con.name as constituency_name,
                w.name as ward_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            LEFT JOIN constituencies con ON v.constituency_id = con.id
            LEFT JOIN wards w ON v.ward_id = w.id
            ORDER BY u.created_at DESC
        `);
        
        console.log(`Found ${result.rows.length} voters`);
        res.json({ success: true, voters: result.rows });
    } catch (error) {
        console.error('Error fetching voters:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get voter by ID
router.get('/voters/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                v.*,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                c.name as county_name,
                con.name as constituency_name,
                w.name as ward_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            LEFT JOIN constituencies con ON v.constituency_id = con.id
            LEFT JOIN wards w ON v.ward_id = w.id
            WHERE v.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Voter not found' });
        }
        
        res.json({ success: true, voter: result.rows[0] });
    } catch (error) {
        console.error('Error fetching voter:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;