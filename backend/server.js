const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log("DB PASSWORD (raw):", process.env.DB_PASSWORD);
console.log("Type:", typeof process.env.DB_PASSWORD);

const authRoutes = require('./routes/authRoutes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'IEBC Blockchain Voting System API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);

// Health check with database
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});