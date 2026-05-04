const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { authenticate, isSuperAdmin } = require('../middleware/auth');

// Apply super admin authentication to all routes
router.use(authenticate, isSuperAdmin);

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
                (SELECT COUNT(*) FROM polling_stations) as total_polling_stations,
                (SELECT COUNT(*) FROM political_parties) as total_parties,
                (SELECT COUNT(*) FROM candidates) as total_candidates,
                (SELECT COUNT(*) FROM votes) as total_votes_cast,
                (SELECT COUNT(*) FROM reports) as total_reports,
                (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports
        `);
        
        res.json({ success: true, statistics: stats.rows[0] });
    } catch (error) {
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
                   ap.department, ap.position, ap.permissions
            FROM users u
            LEFT JOIN admin_profiles ap ON u.id = ap.user_id
            WHERE u.role IN ('admin', 'iebc_official')
            ORDER BY u.created_at DESC
        `);
        res.json({ success: true, admins: result.rows });
    } catch (error) {
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
            `INSERT INTO users (national_id, first_name, last_name, email, phone, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [national_id, first_name, last_name, email, phone, hashedPassword, role, true]
        );
        
        await pool.query(
            `INSERT INTO admin_profiles (user_id, department, position)
             VALUES ($1, $2, $3)`,
            [userResult.rows[0].id, department, position]
        );
        
        res.json({ success: true, message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/admins/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PRESIDENTIAL CANDIDATES
// ============================================

router.get('/presidential-candidates', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pc.*, p.name as party_name, p.symbol as party_symbol
            FROM presidential_candidates pc
            LEFT JOIN political_parties p ON pc.party_id = p.id
            ORDER BY pc.name
        `);
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/presidential-candidates', async (req, res) => {
    const { name, party_id, running_mate, symbol, slogan, manifesto, is_independent } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO presidential_candidates (name, party_id, running_mate, symbol, slogan, manifesto, is_independent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [name, party_id, running_mate, symbol, slogan, manifesto, is_independent || false]
        );
        res.json({ success: true, candidate: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/presidential-candidates/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM presidential_candidates WHERE id = $1', [id]);
        res.json({ success: true, message: 'Candidate deleted successfully' });
    } catch (error) {
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
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        res.json({ success: true, auditLogs: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;