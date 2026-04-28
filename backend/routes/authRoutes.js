const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ============ REGISTRATION - Simple ============
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
    
    console.log('Login attempt for ID:', nationalId);
    
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
            WHERE u.national_id = $1
        `;
        
        const result = await pool.query(query, [nationalIdStr]);
        
        if (result.rows.length === 0) {
            console.log('No user found with ID:', nationalIdStr);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        const user = result.rows[0];
        
        if (!user.is_active) {
            return res.status(401).json({ 
                success: false, 
                error: 'Account deactivated. Contact IEBC.' 
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', nationalIdStr);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid National ID or password' 
            });
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.user_id]
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.user_id, 
                nationalId: user.national_id,
                role: 'voter',
                voterId: user.voter_id
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        // Log login
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, details)
             VALUES ($1, $2, $3)`,
            [user.user_id, 'LOGIN', `Voter ${nationalId} logged in successfully`]
        );
        
        res.json({
            success: true,
            token,
            voter: {
                id: user.voter_id,
                nationalId: user.national_id,
                firstName: user.first_name,
                lastName: user.last_name,
                hasVoted: user.has_voted || false
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
});

// ============ ADMIN LOGIN ============
router.post('/admin/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Admin login attempt for ID:', nationalId);
    
    try {
        const query = `
            SELECT * FROM users 
            WHERE national_id = $1 AND role = 'admin'
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
                nationalId: admin.national_id,
                role: 'admin'
            },
            process.env.JWT_SECRET || 'test_secret_key',
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                nationalId: admin.national_id,
                name: `${admin.first_name} ${admin.last_name}`,
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
                u.national_id,
                u.first_name,
                u.last_name,
                v.has_voted
            FROM users u
            LEFT JOIN voters v ON u.id = v.user_id
            WHERE u.national_id = $1 AND u.role = 'voter'
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
                hasVoted: voter.has_voted,
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