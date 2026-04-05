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
        // For testing: accept any ID with password 'test123'
        // Remove this in production!
        if (password === 'test123') {
            const token = jwt.sign(
                { id: 1, role: 'voter', nationalId: nationalId },
                process.env.JWT_SECRET || 'temp_secret',
                { expiresIn: '24h' }
            );
            
            return res.json({
                success: true,
                token,
                voter: {
                    id: 1,
                    nationalId: nationalId,
                    firstName: 'Test',
                    lastName: 'Voter',
                    pollingStationId: 1
                }
            });
        }
        
        // Real database query (commented for now until you add real voter data)
        /*
        const voterQuery = `
            SELECT v.*, u.email, u.password_hash, u.first_name, u.last_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(voterQuery, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const voter = result.rows[0];
        const validPassword = await bcrypt.compare(password, voter.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: voter.user_id, role: 'voter', nationalId: voter.national_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            voter: {
                id: voter.id,
                nationalId: voter.national_id,
                firstName: voter.first_name,
                lastName: voter.last_name
            }
        });
        */
        
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
        // For testing: return mock data
        if (nationalId) {
            return res.json({
                fullName: 'John Doe',
                nationalId: nationalId,
                county: 'Nairobi',
                constituency: 'Starehe',
                pollingStation: 'PS-001'
            });
        }
        
        // Real database query (commented for now)
        /*
        const query = `
            SELECT v.national_id, u.first_name, u.last_name, 
                   v.polling_station_id
            FROM voters v
            JOIN users u ON v.user_id = u.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Voter not found' });
        }
        
        const voter = result.rows[0];
        res.json({
            fullName: `${voter.first_name} ${voter.last_name}`,
            nationalId: voter.national_id,
            pollingStation: voter.polling_station_id
        });
        */
        
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
        // For testing: accept admin@iebc.or.ke with password 'admin123'
        if (email === 'admin@iebc.or.ke' && password === 'admin123') {
            const token = jwt.sign(
                { id: 1, role: 'admin', email: email },
                process.env.JWT_SECRET || 'temp_secret',
                { expiresIn: '24h' }
            );
            
            return res.json({
                success: true,
                token,
                admin: {
                    id: 1,
                    name: 'IEBC Administrator',
                    email: email
                }
            });
        }
        
        return res.status(401).json({ error: 'Invalid credentials' });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

module.exports = router;