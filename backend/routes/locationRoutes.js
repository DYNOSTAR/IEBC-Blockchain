const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all counties (Public - No authentication needed)
router.get('/counties', async (req, res) => {
    try {
        console.log('Fetching counties...');
        const result = await pool.query('SELECT id, name, code FROM counties ORDER BY name');
        console.log(`Found ${result.rows.length} counties`);
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get constituencies by county (Public)
router.get('/constituencies/:countyId', async (req, res) => {
    const { countyId } = req.params;
    console.log(`Fetching constituencies for county: ${countyId}`);
    try {
        const result = await pool.query(
            'SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name',
            [countyId]
        );
        console.log(`Found ${result.rows.length} constituencies`);
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get wards by constituency (Public)
router.get('/wards/:constituencyId', async (req, res) => {
    const { constituencyId } = req.params;
    console.log(`Fetching wards for constituency: ${constituencyId}`);
    try {
        const result = await pool.query(
            'SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name',
            [constituencyId]
        );
        console.log(`Found ${result.rows.length} wards`);
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get polling stations by ward (Public)
router.get('/polling-stations/:wardId', async (req, res) => {
    const { wardId } = req.params;
    console.log(`Fetching polling stations for ward: ${wardId}`);
    try {
        const result = await pool.query(
            'SELECT id, name, code, location FROM polling_stations WHERE ward_id = $1 ORDER BY name',
            [wardId]
        );
        console.log(`Found ${result.rows.length} polling stations`);
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        console.error('Error fetching polling stations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;