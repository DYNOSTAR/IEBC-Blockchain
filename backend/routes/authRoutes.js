const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ============ SIMPLE REGISTRATION - Only ID, Name, Password ============
router.post('/register', async (req, res) => {
    const { nationalId, firstName, lastName, password } = req.body;
    
    console.log('Registration attempt:', { nationalId, firstName, lastName });
    
    try {
        // Check if national ID already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE national_id = $1',
            [nationalId]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'National ID already registered. Please login.' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user - national_id is the primary identifier
        const userResult = await pool.query(
            `INSERT INTO users (national_id, first_name, last_name, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [nationalId, firstName, lastName, hashedPassword, 'voter']
        );
        
        const userId = userResult.rows[0].id;
        
        // Create voter record
        await pool.query(
            `INSERT INTO voters (user_id, has_voted)
             VALUES ($1, $2)`,
            [userId, false]
        );
        
        // Log registration
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, $2, $3)`,
            [userId, 'REGISTRATION', `Voter ${nationalId} (${firstName} ${lastName}) registered`]
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

// ============ VOTER LOGIN - Using National ID ============
router.post('/voter/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Voter login attempt for ID:', nationalId);
    
    try {
        const nationalIdStr = String(nationalId).trim();
        
        const query = `
            SELECT 
                u.id as user_id,
                u.national_id,
                u.first_name,
                u.last_name,
                u.password_hash,
                u.role,
                u.is_active,
                v.id as voter_id,
                v.has_voted
            FROM users u
            LEFT JOIN voters v ON u.id = v.user_id
            WHERE u.national_id = $1 AND u.role = 'voter'
        `;
        
        const result = await pool.query(query, [nationalIdStr]);
        
        if (result.rows.length === 0) {
            console.log('No voter found with ID:', nationalIdStr);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        const voter = result.rows[0];
        
        if (!voter.is_active) {
            return res.status(401).json({ 
                success: false, 
                error: 'Account deactivated. Contact IEBC.' 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, voter.password_hash);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', nationalIdStr);
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
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, $2, $3)`,
            [voter.user_id, 'LOGIN', `Voter ${nationalId} logged in successfully`]
        );
        
        res.json({
            success: true,
            token,
            voter: {
                id: voter.user_id,
                userId: voter.user_id,
                nationalId: voter.national_id,
                firstName: voter.first_name,
                lastName: voter.last_name,
                hasVoted: voter.has_voted || false
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

// ============ ADMIN LOGIN (Regular Admin) ============
router.post('/admin/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Admin login attempt for ID:', nationalId);
    
    try {
        const query = `
            SELECT * FROM users 
            WHERE national_id = $1 AND role IN ('admin', 'iebc_official')
        `;
        
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
            });
        }
        
        const admin = result.rows[0];
        
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid credentials' 
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
                nationalId: admin.national_id,
                name: `${admin.first_name} ${admin.last_name}`
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: `${admin.first_name} ${admin.last_name}`,
                nationalId: admin.national_id,
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

// ============ SUPER ADMIN LOGIN ============
router.post('/super-admin/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Super Admin login attempt for ID:', nationalId);
    
    try {
        const query = `
            SELECT id, national_id, first_name, last_name, email, password_hash, role, is_active 
            FROM users 
            WHERE national_id = $1 AND role = 'super_admin'
        `;
        
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        const admin = result.rows[0];
        
        if (!admin.is_active) {
            return res.status(401).json({ 
                success: false, 
                error: 'Account is deactivated' 
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        const token = jwt.sign(
            { 
                id: admin.id, 
                role: admin.role,
                nationalId: admin.national_id,
                name: `${admin.first_name} ${admin.last_name}`
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                name: `${admin.first_name} ${admin.last_name}`,
                nationalId: admin.national_id,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Super Admin login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});
// ============ REGISTER SUPER ADMIN ============
router.post('/register-super-admin', async (req, res) => {
    const { nationalId, firstName, lastName, email, phone, password } = req.body;
    
    console.log('Super Admin registration attempt:', { nationalId, firstName, lastName, email, phone });
    
    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE national_id = $1',
            [nationalId]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'National ID already registered' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create super admin
        const userResult = await pool.query(
            `INSERT INTO users (national_id, first_name, last_name, email, phone, password_hash, role, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING id, national_id, first_name, last_name, role`,
            [nationalId, firstName, lastName, email || null, phone || null, hashedPassword, 'super_admin', true]
        );
        
        console.log('Super Admin registration successful:', userResult.rows[0]);
        
        res.json({
            success: true,
            message: 'Super Admin registered successfully!',
            user: userResult.rows[0]
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed: ' + error.message 
        });
    }
});
// ============ REGISTER ADMIN (by Super Admin) ============
router.post('/register-admin', async (req, res) => {
    const { nationalId, firstName, lastName, email, phone, password, role, department, position } = req.body;
    
    console.log('Admin registration attempt:', { nationalId, firstName, lastName });
    
    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE national_id = $1',
            [nationalId]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'National ID already registered' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create admin
        const userResult = await pool.query(
            `INSERT INTO users (national_id, first_name, last_name, email, phone, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [nationalId, firstName, lastName, email || null, phone || null, hashedPassword, role || 'admin', true]
        );
        
        const userId = userResult.rows[0].id;
        
        // Create admin profile
        await pool.query(
            `INSERT INTO admin_profiles (user_id, department, position)
             VALUES ($1, $2, $3)`,
            [userId, department || null, position || null]
        );
        
        console.log('Admin registration successful for:', nationalId);
        
        res.json({
            success: true,
            message: 'Admin registered successfully!'
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

// ============ VOTER REGISTRATION (Creates both user and voter records) ============
router.post('/register', async (req, res) => {
    const { nationalId, firstName, lastName, email, phone, countyId, constituencyId, wardId, password } = req.body;
    
    console.log('Voter registration attempt:', { nationalId, firstName, lastName });
    
    try {
        // Check if national ID already exists in users table
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE national_id = $1',
            [nationalId]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'National ID already registered. Please login.' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user account (role = 'voter')
        const userResult = await pool.query(
            `INSERT INTO users (national_id, first_name, last_name, email, phone, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [nationalId, firstName, lastName, email || null, phone || null, hashedPassword, 'voter', true]
        );
        
        const userId = userResult.rows[0].id;
        
        // Create voter record (linked to user)
        await pool.query(
            `INSERT INTO voters (user_id, national_id, county_id, constituency_id, ward_id, has_voted, registered_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [userId, nationalId, countyId || null, constituencyId || null, wardId || null, false]
        );
        
        // Log registration
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, $2, $3)`,
            [userId, 'REGISTRATION', `Voter ${nationalId} (${firstName} ${lastName}) registered`]
        );
        
        console.log('Voter registration successful for:', nationalId);
        
        // Generate token for auto-login
        const token = jwt.sign(
            { id: userId, role: 'voter', nationalId: nationalId },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: 'Registration successful!',
            token: token,
            voter: {
                id: userId,
                nationalId: nationalId,
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                hasVoted: false
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Registration failed: ' + error.message 
        });
    }
});
// ============ TEST ROUTE ============
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

module.exports = router;