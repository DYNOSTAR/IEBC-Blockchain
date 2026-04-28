const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ── Register new voter ────────────────────────────────────────
const registerVoter = async (req, res) => {
    const { firstName, lastName, nationalId, email, phone, county, constituency, pollingStation, password } = req.body;
 
    if (!firstName || !lastName || !nationalId || !email || !phone || !password) {
        return res.status(400).json({ success: false, error: 'All required fields must be filled.' });
    }
 
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
 
        // Check national ID not already registered
        const existing = await client.query(
            'SELECT id FROM voters WHERE national_id = $1', [nationalId]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'This National ID is already registered.' });
        }
 
        // Check email not taken
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1', [email]
        );
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ success: false, error: 'This email is already in use.' });
        }
 
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
 
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
 
        // Get county ID
        const countyResult = await client.query(
            'SELECT id FROM counties WHERE name ILIKE $1', [county]
        );
        const countyId = countyResult.rows[0]?.id || null;
 
        // Create user (not active until OTP verified)
        const userResult = await client.query(
            `INSERT INTO users (first_name, last_name, email, password, role, is_active, otp_code, otp_expires_at)
             VALUES ($1, $2, $3, $4, 'voter', FALSE, $5, $6)
             RETURNING id`,
            [firstName, lastName, email, hashedPassword, otpHash, otpExpiry]
        );
 
        const userId = userResult.rows[0].id;
 
        // Create voter record
        await client.query(
            `INSERT INTO voters (user_id, national_id, polling_station_id, county_id, ward, has_voted)
             VALUES ($1, $2, $3, $4, $5, FALSE)`,
            [userId, nationalId, pollingStation || null, countyId, constituency || null]
        );
 
        await client.query('COMMIT');
 
        // TODO: Send OTP via Africa's Talking SMS or Nodemailer
        // For development, log the OTP to console
        console.log(`\n📱 OTP for ${email} / ${phone}: ${otp}\n`);
 
        res.status(201).json({
            success: true,
            userId,
            message: `Verification code sent to ${phone} and ${email}. Enter it to activate your account.`
        });
 
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    } finally {
        client.release();
    }
};

// ── Verify OTP ────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
    const { userId, otpCode } = req.body;
 
    if (!userId || !otpCode) {
        return res.status(400).json({ success: false, error: 'User ID and OTP code are required.' });
    }
 
    try {
        const result = await pool.query(
            'SELECT otp_code, otp_expires_at FROM users WHERE id = $1',
            [userId]
        );
 
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
 
        const { otp_code, otp_expires_at } = result.rows[0];
 
        if (!otp_code) {
            return res.status(400).json({ success: false, error: 'No pending verification for this account.' });
        }
 
        if (new Date() > new Date(otp_expires_at)) {
            return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
        }
 
        const isValid = await bcrypt.compare(otpCode.trim(), otp_code);
        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Invalid verification code.' });
        }
 
        // Activate account and clear OTP
        await pool.query(
            'UPDATE users SET is_active = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
            [userId]
        );
 
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'ACCOUNT_VERIFIED', 'Voter account activated via OTP']
        );
 
        res.json({ success: true, message: 'Account verified successfully. You can now login.' });
 
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed. Please try again.' });
    }
};
 
// ── Resend OTP ────────────────────────────────────────────────
const resendOtp = async (req, res) => {
    const { userId } = req.body;
 
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required.' });
    }
 
    try {
        const result = await pool.query(
            'SELECT email, is_active FROM users WHERE id = $1', [userId]
        );
 
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }
 
        if (result.rows[0].is_active) {
            return res.status(400).json({ success: false, error: 'Account is already verified.' });
        }
 
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
 
        await pool.query(
            'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
            [otpHash, otpExpiry, userId]
        );
 
        // TODO: Send via SMS/email
        console.log(`\n📱 New OTP for user ${userId}: ${otp}\n`);
 
        res.json({ success: true, message: 'New verification code sent.' });
 
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, error: 'Failed to resend code.' });
    }
};

// Voter Login
const voterLogin = async (req, res) => {
    const { nationalId, password } = req.body;

    if (!nationalId || !password) {
        return res.status(400).json({ success: false, error: 'National ID and password are required.' });
    }

    try {
        const query = `
            SELECT 
                u.id as user_id, u.first_name, u.last_name, u.email,
                u.password, u.role, u.is_active,
                v.id as voter_id, v.national_id, v.polling_station_id,
                v.has_voted, v.county_id,
                c.name as county_name
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(query, [nationalId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid National ID or password.' });
        }

        const voter = result.rows[0];

        if (!voter.is_active) {
            return res.status(401).json({ success: false, error: 'Your account has been deactivated.' });
        }

        const passwordMatch = await bcrypt.compare(password, voter.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: 'Invalid National ID or password.' });
        }

        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [voter.user_id]);

        const token = jwt.sign(
            { id: voter.user_id, role: 'voter', nationalId: voter.national_id, voterId: voter.voter_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
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
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Admin Login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    try {
        const query = `
            SELECT * FROM users 
            WHERE email = $1 AND role IN ('admin', 'iebc_official')
        `;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        const admin = result.rows[0];

        if (!admin.is_active) {
            return res.status(401).json({ success: false, error: 'Your account has been deactivated.' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [admin.id]);

        const token = jwt.sign(
            { id: admin.id, role: admin.role, email: admin.email, name: `${admin.first_name} ${admin.last_name}` },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
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
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Verify Voter Registration
const verifyVoter = async (req, res) => {
    const { nationalId } = req.body;

    if (!nationalId) {
        return res.status(400).json({ success: false, error: 'National ID is required.' });
    }

    try {
        const query = `
            SELECT v.national_id, u.first_name, u.last_name,
                   c.name as county_name, v.polling_station_id, v.ward
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            WHERE v.national_id = $1
        `;
        const result = await pool.query(query, [nationalId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Voter not found.' });
        }

        const voter = result.rows[0];
        res.json({
            success: true,
            voter: {
                fullName: `${voter.first_name} ${voter.last_name}`,
                nationalId: voter.national_id,
                county: voter.county_name,
                pollingStation: voter.polling_station_id,
                ward: voter.ward
            }
        });

    } catch (error) {
        console.error('Verify voter error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'voter') {
            const query = `
                SELECT u.id, u.first_name, u.last_name, u.email, u.role,
                       v.national_id, v.polling_station_id, v.has_voted, v.county_id,
                       c.name as county_name
                FROM users u
                JOIN voters v ON u.id = v.user_id
                LEFT JOIN counties c ON v.county_id = c.id
                WHERE u.id = $1
            `;
            const result = await pool.query(query, [userId]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });
            return res.json({ success: true, user: result.rows[0] });
        }

        const query = 'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1';
        const result = await pool.query(query, [userId]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });
        res.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [req.user.id, 'LOGOUT', 'User logged out']
        );
        res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: 'Server error.' });
    }
};

module.exports = { voterLogin, adminLogin, verifyVoter, getCurrentUser, logout, registerVoter, verifyOtp, resendOtp};