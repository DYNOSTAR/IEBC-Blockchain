const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working' });
});

// Voter Login
router.post('/voter/login', async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Login attempt for nationalId:', nationalId);
    
    try {
        // Query voter by national ID
        const voterQuery = `
            SELECT v.id, v.user_id, v.national_id, v.county, v.constituency, v.polling_station_id, 
                   u.password_hash, u.first_name, u.last_name, u.role
            FROM voters v
            JOIN users u ON v.user_id = u.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(voterQuery, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid national ID or password' });
        }
        
        const voter = result.rows[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, voter.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid national ID or password' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { id: voter.user_id, voterId: voter.id, role: 'voter', nationalId: voter.national_id },
            process.env.JWT_SECRET || 'temp_secret',
            { expiresIn: '24h' }
        );
        
        return res.json({
            success: true,
            token,
            voter: {
                id: voter.id,
                userId: voter.user_id,
                nationalId: voter.national_id,
                firstName: voter.first_name,
                lastName: voter.last_name,
                county: voter.county,
                constituency: voter.constituency,
                pollingStationId: voter.polling_station_id
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Verify Voter Registration
router.post('/verify-voter', async (req, res) => {
    const { nationalId } = req.body;
    
    console.log('Verifying nationalId:', nationalId);
    
    try {
        const query = `
            SELECT v.national_id, u.first_name, u.last_name, 
                   v.county, v.constituency, v.polling_station_id
            FROM voters v
            JOIN users u ON v.user_id = u.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Voter not found' });
        }
        
        const voter = result.rows[0];
        return res.json({
            found: true,
            fullName: `${voter.first_name} ${voter.last_name}`,
            nationalId: voter.national_id,
            county: voter.county,
            constituency: voter.constituency,
            pollingStation: `PS-${String(voter.polling_station_id).padStart(3, '0')}`
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log('Admin login attempt for:', email);
    
    try {
        // Query admin by email
        const adminQuery = `
            SELECT a.id, u.id as user_id, u.email, u.password_hash, u.first_name, u.last_name, 
                   u.role, a.position, a.department
            FROM admins a
            JOIN users u ON a.user_id = u.id
            WHERE u.email = $1 AND u.role = 'admin'
        `;
        const result = await pool.query(adminQuery, [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const admin = result.rows[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { id: admin.user_id, adminId: admin.id, role: 'admin', email: admin.email },
            process.env.JWT_SECRET || 'temp_secret',
            { expiresIn: '24h' }
        );
        
        return res.json({
            success: true,
            token,
            admin: {
                id: admin.id,
                userId: admin.user_id,
                name: `${admin.first_name} ${admin.last_name}`,
                email: admin.email,
                position: admin.position,
                department: admin.department
            }
        });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;