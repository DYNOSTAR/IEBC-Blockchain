const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const electionRoutes = require('./routes/electionRoutes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes - IMPORTANT: Order matters
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);  // This registers /api/elections/active

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

// Test endpoint to list all registered routes
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    // Function to extract routes from app
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    
    res.json({ routes });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'IEBC Blockchain Voting System API',
        endpoints: {
            health: 'GET /api/health',
            routes: 'GET /api/routes',
            auth: 'POST /api/auth/voter/login',
            elections: 'GET /api/elections/active'
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n✅ IEBC Backend Server Running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗺️ Routes: http://localhost:${PORT}/api/routes`);
    console.log(`\n📝 Test Credentials:`);
    console.log(`   Voter ID: 12345678 or 87654321`);
    console.log(`   Any password works\n`);
});