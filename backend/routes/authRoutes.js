const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ============ REGISTRATION ROUTE ============
router.post('/register', async (req, res) => {
    const {
        firstName,
        lastName,
        nationalId,
        passportNumber,
        email,
        phone,
        county,
        constituency,
        ward,
        pollingStation,
        password
    } = req.body;
    
    console.log('Registration attempt for:', { firstName, lastName, nationalId, email });
    
    try {
        // Check if voter already exists
        const existingCheck = await pool.query(
            `SELECT v.id FROM voters v 
             WHERE v.national_id = $1 
             UNION 
             SELECT u.id FROM users u WHERE u.email = $2`,
            [nationalId, email]
        );
        
        if (existingCheck.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Voter already registered with this National ID or Email' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create username from national ID
        const username = `voter_${nationalId}`;
        
        // Create user account
        const userResult = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, phone, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [username, email, hashedPassword, firstName, lastName, 'voter', phone, true]
        );
        
        const userId = userResult.rows[0].id;
        
        // Get polling station ID if provided
        let pollingStationId = null;
        if (pollingStation) {
            const psResult = await pool.query(
                `SELECT id FROM polling_stations WHERE code = $1 OR name ILIKE $2 LIMIT 1`,
                [pollingStation, `%${pollingStation}%`]
            );
            if (psResult.rows.length > 0) {
                pollingStationId = psResult.rows[0].id;
            }
        }
        
        // Create voter record
        await pool.query(
            `INSERT INTO voters (user_id, national_id, passport_number, county_id, constituency_id, ward_id, polling_station_id, has_voted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, nationalId, passportNumber || null, county || null, constituency || null, ward || null, pollingStationId, false]
        );
        
        // Log registration
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, $2, $3)`,
            [userId, 'REGISTRATION', `Voter ${nationalId} (${firstName} ${lastName}) registered successfully`]
        );
        
        console.log('Registration successful for:', nationalId);
        
        res.json({
            success: true,
            message: 'Registration successful! You can now login.'
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed: ' + error.message 
        });
    }
});

// ============ GET COUNTIES ============
router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, code FROM counties ORDER BY name');
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ GET CONSTITUENCIES BY COUNTY ============
router.get('/constituencies/:countyId', async (req, res) => {
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

// ============ GET WARDS BY CONSTITUENCY ============
router.get('/wards/:constituencyId', async (req, res) => {
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

// ============ GET POLLING STATIONS BY WARD ============
router.get('/polling-stations/:wardId', async (req, res) => {
    const { wardId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code, location FROM polling_stations WHERE ward_id = $1 ORDER BY name`,
            [wardId]
        );
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        console.error('Error fetching polling stations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ VOTER LOGIN ============
router.post('/voter/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Voter login attempt for ID:', nationalId);
    
    try {
        const query = `
            SELECT 
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password_hash,
                u.role,
                u.is_active,
                v.id as voter_id,
                v.national_id,
                v.polling_station_id,
                v.has_voted,
                v.county_id,
                c.name as county_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            WHERE v.national_id = $1
        `;
        
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        const voter = result.rows[0];
        
        if (!voter.is_active) {
            return res.status(401).json({ 
                success: false, 
                error: 'Your account has been deactivated. Please contact IEBC.' 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, voter.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [voter.user_id]
        );
        
        const token = jwt.sign(
            { 
                id: voter.user_id, 
                role: 'voter',
                nationalId: voter.national_id,
                voterId: voter.voter_id
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [voter.user_id, 'VOTER_LOGIN', `Voter ${nationalId} logged in successfully`]
        );
        
        res.json({
            success: true,
            token,
            voter: {
                id: voter.voter_id,
                userId: voter.user_id,
                nationalId: voter.national_id,
                firstName: voter.first_name,
                lastName: voter.last_name,
                email: voter.email,
                pollingStationId: voter.polling_station_id,
                countyId: voter.county_id,
                countyName: voter.county_name,
                hasVoted: voter.has_voted
            }
        });
        
    } catch (error) {
        console.error('Voter login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});

// ============ ADMIN LOGIN ============
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Admin login attempt for:', email);
    
    try {
        const query = `
            SELECT * FROM users 
            WHERE email = $1 AND role IN ('admin', 'iebc_official')
        `;
        
        const result = await pool.query(query, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        const admin = result.rows[0];
        
        if (!admin.is_active) {
            return res.status(401).json({ 
                success: false, 
                error: 'Your account has been deactivated.' 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid email or password' 
            });
        }
        
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [admin.id]
        );
        
        const token = jwt.sign(
            { 
                id: admin.id, 
                role: admin.role,
                email: admin.email,
                name: `${admin.first_name} ${admin.last_name}`
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [admin.id, 'ADMIN_LOGIN', `Admin ${email} logged in successfully`]
        );
        
        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: `${admin.first_name} ${admin.last_name}`,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});

// ============ VERIFY VOTER ============
router.post('/verify-voter', async (req, res) => {
    const { nationalId } = req.body;
    
    try {
        const query = `
            SELECT 
                v.national_id,
                u.first_name,
                u.last_name,
                c.name as county_name,
                ps.name as polling_station_name,
                w.name as ward_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            LEFT JOIN polling_stations ps ON v.polling_station_id = ps.id
            LEFT JOIN wards w ON v.ward_id = w.id
            WHERE v.national_id = $1
        `;
        
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Voter not found. Please register first.' 
            });
        }
        
        const voter = result.rows[0];
        
        res.json({
            success: true,
            voter: {
                fullName: `${voter.first_name} ${voter.last_name}`,
                nationalId: voter.national_id,
                county: voter.county_name,
                pollingStation: voter.polling_station_name,
                ward: voter.ward_name,
                status: 'Registered'
            }
        });
        
    } catch (error) {
        console.error('Verify voter error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});

// ============ TEST ROUTE ============
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

module.exports = router;