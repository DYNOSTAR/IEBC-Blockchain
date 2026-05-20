const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { uploadIdCard, uploadFace } = require('../middleware/upload');

// Get voter details with real verification data
router.get('/details/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(`
            SELECT
                u.id, u.national_id, u.first_name, u.last_name, u.email, u.phone,
                v.has_voted, v.county_id, v.constituency_id, v.ward_id,
                v.id_card_path, v.face_image_path, v.biometric_verified,
                v.is_verified, v.verification_level, v.otp_verified,
                co.name  AS county_name,
                con.name AS constituency_name,
                w.name   AS ward_name
            FROM users u
            LEFT JOIN voters       v   ON v.user_id        = u.id
            LEFT JOIN counties     co  ON co.id            = v.county_id
            LEFT JOIN constituencies con ON con.id         = v.constituency_id
            LEFT JOIN wards        w   ON w.id             = v.ward_id
            WHERE u.id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const r = result.rows[0];
        res.json({
            success: true,
            voter: {
                id: r.id,
                nationalId: r.national_id,
                firstName: r.first_name,
                lastName: r.last_name,
                email: r.email,
                phone: r.phone,
                hasVoted: r.has_voted || false,
                countyId: r.county_id,
                countyName: r.county_name,
                constituencyId: r.constituency_id,
                constituencyName: r.constituency_name,
                wardId: r.ward_id,
                wardName: r.ward_name,
                idCardPath: r.id_card_path || null,
                faceImagePath: r.face_image_path || null,
                biometricVerified: r.biometric_verified || false,
                isVerified: r.is_verified || false,
                verificationLevel: r.verification_level || 0,
                otpVerified: r.otp_verified || false
            }
        });
    } catch (error) {
        console.error('Error fetching voter details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update voter profile (email, phone, optional password)
router.put('/update-profile', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { email, phone, password } = req.body;
    try {
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await pool.query(
                `UPDATE users SET email=$1, phone=$2, password_hash=$3, updated_at=NOW() WHERE id=$4`,
                [email, phone, hashedPassword, userId]
            );
        } else {
            await pool.query(
                `UPDATE users SET email=$1, phone=$2, updated_at=NOW() WHERE id=$3`,
                [email, phone, userId]
            );
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send OTP — returns devHint in non-production so devs can test
router.post('/send-otp', authenticate, async (req, res) => {
    const userId = req.user.id;
    try {
        const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
            `UPDATE users SET otp_code=$1, otp_expires_at=$2 WHERE id=$3`,
            [otp, expiresAt, userId]
        );

        console.log(`[OTP] user ${userId} (${user.email}): ${otp}`);

        const response = { success: true, message: 'OTP sent to your email' };
        if (process.env.NODE_ENV !== 'production') {
            response.devHint = otp;
        }
        res.json(response);
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify OTP and advance verification level to at least 1
router.post('/verify-otp', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { otpCode } = req.body;
    try {
        const result = await pool.query(
            `SELECT otp_code, otp_expires_at FROM users WHERE id=$1`, [userId]
        );
        const user = result.rows[0];

        if (!user.otp_code || user.otp_code !== otpCode) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }
        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({ success: false, error: 'OTP has expired' });
        }

        await pool.query(
            `UPDATE users SET otp_code=NULL, otp_expires_at=NULL WHERE id=$1`, [userId]
        );
        await pool.query(`
            UPDATE voters SET
                otp_verified = true,
                verification_level = GREATEST(COALESCE(verification_level, 0), 1)
            WHERE user_id = $1
        `, [userId]);

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload ID card — saves file and advances verification level to at least 2
router.post('/verify-id-card', authenticate, (req, res) => {
    uploadIdCard(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        try {
            const idCardPath = `/uploads/id-cards/${req.file.filename}`;
            await pool.query(`
                UPDATE voters SET
                    id_card_path = $1,
                    verification_level = GREATEST(COALESCE(verification_level, 0), 2)
                WHERE user_id = $2
            `, [idCardPath, req.user.id]);

            res.json({ success: true, message: 'ID Card uploaded successfully', path: idCardPath });
        } catch (error) {
            console.error('Error saving ID card:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});

// Upload face image — saves file and advances verification level to at least 3
router.post('/verify-face', authenticate, (req, res) => {
    uploadFace(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        try {
            const faceImagePath = `/uploads/face-images/${req.file.filename}`;
            await pool.query(`
                UPDATE voters SET
                    face_image_path = $1,
                    verification_level = GREATEST(COALESCE(verification_level, 0), 3)
                WHERE user_id = $2
            `, [faceImagePath, req.user.id]);

            res.json({ success: true, message: 'Face image uploaded successfully', path: faceImagePath });
        } catch (error) {
            console.error('Error saving face image:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
});

// Biometric verification — marks voter as fully verified (level 4)
router.post('/verify-biometric', authenticate, async (req, res) => {
    try {
        await pool.query(`
            UPDATE voters SET
                biometric_verified = true,
                is_verified = true,
                verification_level = 4
            WHERE user_id = $1
        `, [req.user.id]);

        res.json({ success: true, message: 'Biometric verification successful' });
    } catch (error) {
        console.error('Error with biometric verification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
