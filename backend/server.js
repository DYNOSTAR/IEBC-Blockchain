const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const electionRoutes = require('./routes/electionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const locationRoutes = require('./routes/locationRoutes');

const pool = require('./config/db');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ============ REGISTER ALL ROUTES ============
// Auth routes - handles /api/auth/register, /api/auth/voter/login, /api/auth/verify-voter, /api/auth/counties, etc.
app.use('/api/auth', authRoutes);

// Election routes - handles /api/elections/active, /api/elections/:id/positions, etc.
app.use('/api/elections', electionRoutes);

// Admin routes - handles /api/admin/*
app.use('/api/admin', adminRoutes);

app.use('/api/super-admin', superAdminRoutes);

app.use('/api/locations', locationRoutes);

// ============ ADD MISSING DIRECT ROUTES ============
// Counties route (direct)
app.get('/api/counties', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, code FROM counties ORDER BY name');
        res.json({ success: true, counties: result.rows });
    } catch (error) {
        console.error('Error fetching counties:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Constituencies by county route
app.get('/api/constituencies/:countyId', async (req, res) => {
    const { countyId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name',
            [countyId]
        );
        res.json({ success: true, constituencies: result.rows });
    } catch (error) {
        console.error('Error fetching constituencies:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Wards by constituency route
app.get('/api/wards/:constituencyId', async (req, res) => {
    const { constituencyId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name',
            [constituencyId]
        );
        res.json({ success: true, wards: result.rows });
    } catch (error) {
        console.error('Error fetching wards:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Polling stations by ward route
app.get('/api/polling-stations/:wardId', async (req, res) => {
    const { wardId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, name, code, location FROM polling_stations WHERE ward_id = $1 ORDER BY name',
            [wardId]
        );
        res.json({ success: true, pollingStations: result.rows });
    } catch (error) {
        console.error('Error fetching polling stations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            time: result.rows[0].now,
            message: 'IEBC Blockchain Voting System API'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message 
        });
    }
});

// List all routes (for debugging)
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    function extractRoutes(stack, basePath = '') {
        stack.forEach(layer => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
                routes.push({
                    path: basePath + layer.route.path,
                    methods: methods
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                extractRoutes(layer.handle.stack, basePath + (layer.regexp.source.replace(/\\/g, '').replace(/\^/g, '').replace(/\?/g, '').replace(/\/i/g, '')));
            }
        });
    }
    
    extractRoutes(app._router.stack);
    res.json({ routes });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'IEBC Blockchain Voting System API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            routes: 'GET /api/routes',
            counties: 'GET /api/counties',
            constituencies: 'GET /api/constituencies/:countyId',
            wards: 'GET /api/wards/:constituencyId',
            polling_stations: 'GET /api/polling-stations/:wardId',
            auth: 'POST /api/auth/register, POST /api/auth/voter/login, POST /api/auth/verify-voter',
            elections: 'GET /api/elections/active, GET /api/elections/:id/positions',
            admin: '/api/admin/*'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error: ' + err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ IEBC Backend Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗺️ Routes list: http://localhost:${PORT}/api/routes`);
    console.log(`\n📝 Available Endpoints:`);
    console.log(`   GET  /api/counties - List all counties`);
    console.log(`   POST /api/auth/register - Register new voter`);
    console.log(`   POST /api/auth/voter/login - Voter login`);
    console.log(`   POST /api/auth/verify-voter - Verify voter status`);
    console.log(`   GET  /api/elections/active - Get active election`);
  
});