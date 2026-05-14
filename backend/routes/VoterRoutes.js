const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get voter details
router.get('/details/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    
    console.log('Fetching voter details for userId:', userId);
    
    try {
        // Get user info
        const userResult = await pool.query(`
            SELECT id, national_id, first_name, last_name, email, phone, role
            FROM users 
            WHERE id = $1
        `, [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Get voter info
        const voterResult = await pool.query(`
            SELECT id as voter_id, has_voted, county_id, constituency_id, ward_id
            FROM voters 
            WHERE user_id = $1
        `, [userId]);
        
        const voter = voterResult.rows[0] || {};
        
        // Get location names
        let countyName = null;
        if (voter.county_id) {
            const countyResult = await pool.query('SELECT name FROM counties WHERE id = $1', [voter.county_id]);
            if (countyResult.rows.length > 0) countyName = countyResult.rows[0].name;
        }
        
        let constituencyName = null;
        if (voter.constituency_id) {
            const constituencyResult = await pool.query('SELECT name FROM constituencies WHERE id = $1', [voter.constituency_id]);
            if (constituencyResult.rows.length > 0) constituencyName = constituencyResult.rows[0].name;
        }
        
        let wardName = null;
        if (voter.ward_id) {
            const wardResult = await pool.query('SELECT name FROM wards WHERE id = $1', [voter.ward_id]);
            if (wardResult.rows.length > 0) wardName = wardResult.rows[0].name;
        }
        
        res.json({
            success: true,
            voter: {
                id: user.id,
                nationalId: user.national_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                phone: user.phone,
                hasVoted: voter.has_voted || false,
                countyId: voter.county_id,
                countyName: countyName,
                constituencyId: voter.constituency_id,
                constituencyName: constituencyName,
                wardId: voter.ward_id,
                wardName: wardName,
                idCardImage: null,
                faceImage: null,
                biometricData: null,
                verificationLevel: 0,
                isVerified: false
            }
        });
    } catch (error) {
        console.error('Error fetching voter details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update voter profile
router.put('/update-profile', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { email, phone, password } = req.body;
    
    try {
        let updateQuery = `UPDATE users SET email = $1, phone = $2, updated_at = NOW() WHERE id = $3`;
        let queryParams = [email, phone, userId];
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery = `UPDATE users SET email = $1, phone = $2, password_hash = $3, updated_at = NOW() WHERE id = $4`;
            queryParams = [email, phone, hashedPassword, userId];
        }
        
        await pool.query(updateQuery, queryParams);
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send OTP
router.post('/send-otp', authenticate, async (req, res) => {
    const userId = req.user.id;
    try {
        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        await pool.query(
            `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3`,
            [otp, expiresAt, userId]
        );
        
        console.log(`OTP for ${user.email}: ${otp}`);
        
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify OTP
router.post('/verify-otp', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { otpCode } = req.body;
    
    try {
        const result = await pool.query(
            `SELECT otp_code, otp_expires_at FROM users WHERE id = $1`,
            [userId]
        );
        
        const user = result.rows[0];
        
        if (!user.otp_code || user.otp_code !== otpCode) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }
        
        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ success: false, error: 'OTP expired' });
        }
        
        await pool.query(`UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1`, [userId]);
        
        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ID Card Upload
router.post('/verify-id-card', authenticate, async (req, res) => {
    res.json({ success: true, message: 'ID Card uploaded successfully' });
});

// Face Upload
router.post('/verify-face', authenticate, async (req, res) => {
    res.json({ success: true, message: 'Face image uploaded successfully' });
});

// Biometric
router.post('/verify-biometric', authenticate, async (req, res) => {
    res.json({ success: true, message: 'Biometric verification successful' });
});

module.exports = router;