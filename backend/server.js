require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const electionRoutes = require('./routes/electionRoutes');
const voteRoutes = require('./routes/voteRoutes');
const pool = require('./config/db');
const { checkBlockchainConnection } = require('./config/blockchain');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 10, message: { success: false, error: 'Too many login attempts.' } });
const generalLimiter = rateLimit({ windowMs: 60*1000, max: 120, message: { success: false, error: 'Too many requests.' } });

app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes',     voteRoutes);

app.get('/api/health', async (req, res) => {
    try {
        const db = await pool.query('SELECT NOW()');
        const blockchain = await checkBlockchainConnection();
        res.json({ status: 'ok', database: 'connected', dbTime: db.rows[0].now, blockchain });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'IEBC Blockchain Voting System API v1.0.0' });
});

app.use((req, res) => res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success: false, error: 'Internal server error.' }); });

app.listen(PORT, () => {
    console.log(`\n✅ IEBC Backend running on port ${PORT}`);
    console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
    console.log(`\n📝 Test credentials:`);
    console.log(`   Voter: 12345678 / Voter@2027`);
    console.log(`   Admin: admin@iebc.or.ke / Admin@2027\n`);
});

module.exports = app;