const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Get candidates by position and location (for voters)
router.get('/by-position', authenticate, async (req, res) => {
    const { position_id } = req.query;
    const userId = req.user.id;
    
    try {
        // Get voter's location
        const voterResult = await pool.query(
            `SELECT county_id, constituency_id, ward_id FROM voters WHERE user_id = $1`,
            [userId]
        );
        
        const voter = voterResult.rows[0];
        
        // Get position details to determine location level
        const positionResult = await pool.query(
            `SELECT name, level FROM positions WHERE id = $1`,
            [position_id]
        );
        
        const position = positionResult.rows[0];
        let locationFilter = '';
        let params = [position_id];
        
        // Apply location filter based on position level
        switch(position.level) {
            case 'national':
                // President - no location filter, show all
                locationFilter = '';
                break;
            case 'county':
                // Governor, Senator, Women Rep - filter by county
                locationFilter = 'AND c.location_type = $2 AND c.location_id = $3';
                params.push('county', voter.county_id);
                break;
            case 'constituency':
                // MP - filter by constituency
                locationFilter = 'AND c.location_type = $2 AND c.location_id = $3';
                params.push('constituency', voter.constituency_id);
                break;
            case 'ward':
                // MCA - filter by ward
                locationFilter = 'AND c.location_type = $2 AND c.location_id = $3';
                params.push('ward', voter.ward_id);
                break;
        }
        
        const candidatesQuery = `
            SELECT c.*, p.name as party_name, p.symbol as party_symbol, p.color as party_color
            FROM candidates c
            LEFT JOIN political_parties p ON c.political_party_id = p.id
            WHERE c.position_id = $1 ${locationFilter}
            ORDER BY c.name
        `;
        
        const result = await pool.query(candidatesQuery, params);
        
        res.json({ success: true, candidates: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all positions with their levels
router.get('/positions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM positions ORDER BY display_order`
        );
        res.json({ success: true, positions: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get counties list (for dropdowns)
router.get('/counties', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM counties ORDER BY name`
        );
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get constituencies by county (for dropdowns)
router.get('/constituencies/by-county/:countyId', async (req, res) => {
    const { countyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name`,
            [countyId]
        );
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get wards by constituency (for dropdowns)
router.get('/wards/by-constituency/:constituencyId', async (req, res) => {
    const { constituencyId } = req.params;
    try {
        const result = await pool.query(
            `SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name`,
            [constituencyId]
        );
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;