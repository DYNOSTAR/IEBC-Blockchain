const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// Get voter details
router.get('/details/:userId', authenticate, async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.national_id, u.first_name, u.last_name, u.email, u.phone, u.role,
                v.id as voter_id, v.has_voted, v.county_id, v.constituency_id, v.ward_id,
                v.id_card_image, v.face_image, v.biometric_data, v.verification_level, v.is_verified,
                c.name as county_name,
                con.name as constituency_name,
                w.name as ward_name
            FROM users u
            LEFT JOIN voters v ON u.id = v.user_id
            LEFT JOIN counties c ON v.county_id = c.id
            LEFT JOIN constituencies con ON v.constituency_id = con.id
            LEFT JOIN wards w ON v.ward_id = w.id
            WHERE u.id = $1
        `, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Voter not found' });
        }
        
        const voter = result.rows[0];
        
        res.json({
            success: true,
            voter: {
                id: voter.user_id,
                nationalId: voter.national_id,
                firstName: voter.first_name,
                lastName: voter.last_name,
                email: voter.email,
                phone: voter.phone,
                hasVoted: voter.has_voted || false,
                countyId: voter.county_id,
                countyName: voter.county_name,
                constituencyId: voter.constituency_id,
                constituencyName: voter.constituency_name,
                wardId: voter.ward_id,
                wardName: voter.ward_name,
                idCardImage: voter.id_card_image,
                faceImage: voter.face_image,
                biometricData: voter.biometric_data,
                verificationLevel: voter.verification_level || 0,
                isVerified: voter.is_verified || false
            }
        });
    } catch (error) {
        console.error('Error fetching voter details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update voter profile (basic info)
router.put('/update-profile', authenticate, async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email, phone, countyId, constituencyId, wardId } = req.body;
    
    try {
        // Update users table
        await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = NOW()
             WHERE id = $5`,
            [firstName, lastName, email, phone, userId]
        );
        
        // Update voters table
        await pool.query(
            `UPDATE voters 
             SET county_id = $1, constituency_id = $2, ward_id = $3
             WHERE user_id = $4`,
            [countyId, constituencyId, wardId, userId]
        );
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload and verify ID Card
router.post('/verify-id-card', authenticate, upload.single('idCardImage'), async (req, res) => {
    const userId = req.user.id;
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const imagePath = `/uploads/${req.file.filename}`;
        
        // Update voter with ID card image path
        await pool.query(
            `UPDATE voters 
             SET id_card_image = $1, verification_level = GREATEST(verification_level, 1)
             WHERE user_id = $2`,
            [imagePath, userId]
        );
        
        // Check if verification is complete
        await updateVerificationStatus(userId);
        
        res.json({ success: true, message: 'ID card uploaded successfully', imagePath: imagePath });
    } catch (error) {
        console.error('Error uploading ID card:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload and verify Face Image
router.post('/verify-face', authenticate, upload.single('faceImage'), async (req, res) => {
    const userId = req.user.id;
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        const imagePath = `/uploads/${req.file.filename}`;
        
        // Update voter with face image path
        await pool.query(
            `UPDATE voters 
             SET face_image = $1, verification_level = GREATEST(verification_level, 2)
             WHERE user_id = $2`,
            [imagePath, userId]
        );
        
        // Check if verification is complete
        await updateVerificationStatus(userId);
        
        res.json({ success: true, message: 'Face image uploaded successfully', imagePath: imagePath });
    } catch (error) {
        console.error('Error uploading face image:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify Biometric
router.post('/verify-biometric', authenticate, async (req, res) => {
    const userId = req.user.id;
    
    try {
        // In a real implementation, this would integrate with biometric scanner
        // For now, we'll simulate success
        const biometricHash = 'bio_' + Date.now() + '_' + userId;
        
        // Update voter with biometric data
        await pool.query(
            `UPDATE voters 
             SET biometric_data = $1, verification_level = GREATEST(verification_level, 3)
             WHERE user_id = $2`,
            [biometricHash, userId]
        );
        
        // Check if verification is complete
        await updateVerificationStatus(userId);
        
        res.json({ success: true, message: 'Biometric verification successful' });
    } catch (error) {
        console.error('Error verifying biometric:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to update verification status
async function updateVerificationStatus(userId) {
    const result = await pool.query(
        `SELECT verification_level, id_card_image, face_image, biometric_data 
         FROM voters WHERE user_id = $1`,
        [userId]
    );
    
    const voter = result.rows[0];
    const hasIdCard = !!voter.id_card_image;
    const hasFaceImage = !!voter.face_image;
    const hasBiometric = !!voter.biometric_data;
    
    const isFullyVerified = hasIdCard && hasFaceImage && hasBiometric;
    
    await pool.query(
        `UPDATE voters SET is_verified = $1 WHERE user_id = $2`,
        [isFullyVerified, userId]
    );
}

// Get verification status
router.get('/verification-status', authenticate, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const result = await pool.query(
            `SELECT verification_level, is_verified, id_card_image, face_image, biometric_data
             FROM voters WHERE user_id = $1`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Voter not found' });
        }
        
        const voter = result.rows[0];
        
        res.json({
            success: true,
            level: voter.verification_level || 0,
            isVerified: voter.is_verified || false,
            hasIdCard: !!voter.id_card_image,
            hasFaceImage: !!voter.face_image,
            hasBiometric: !!voter.biometric_data
        });
    } catch (error) {
        console.error('Error fetching verification status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;