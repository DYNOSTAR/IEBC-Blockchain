const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Voter Login (using plain text password)
const voterLogin = async (req, res) => {
    const { nationalId, password } = req.body;
    
    console.log('Voter login attempt for ID:', nationalId);
    
    try {
        const query = `
            SELECT 
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password,
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
                error: 'Your account has been deactivated.' 
            });
        }
        
        // Direct password comparison (plain text)
        if (voter.password !== password) {
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
};

// Admin Login (using plain text password)
const adminLogin = async (req, res) => {
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
        
        // Direct password comparison (plain text)
        if (admin.password !== password) {
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
};

// Verify Voter Registration
const verifyVoter = async (req, res) => {
    const { nationalId } = req.body;
    
    try {
        const query = `
            SELECT 
                v.national_id,
                u.first_name,
                u.last_name,
                c.name as county_name,
                v.polling_station_id,
                v.ward
            FROM voters v
            JOIN users u ON v.user_id = u.id
            LEFT JOIN counties c ON v.county_id = c.id
            WHERE v.national_id = $1
        `;
        
        const result = await pool.query(query, [nationalId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Voter not found.' 
            });
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
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message 
        });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        
        if (role === 'voter') {
            const query = `
                SELECT 
                    u.id, u.first_name, u.last_name, u.email, u.role,
                    v.national_id, v.polling_station_id, v.has_voted
                FROM users u
                JOIN voters v ON u.id = v.user_id
                WHERE u.id = $1
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            
            res.json({ success: true, user: result.rows[0] });
        } else {
            const query = `
                SELECT id, first_name, last_name, email, role
                FROM users
                WHERE id = $1
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            
            res.json({ success: true, user: result.rows[0] });
        }
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
            [userId, 'LOGOUT', 'User logged out']
        );
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    voterLogin,
    adminLogin,
    verifyVoter,
    getCurrentUser,
    logout
};