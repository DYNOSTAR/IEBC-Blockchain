const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes       = require('./routes/authRoutes');
const electionRoutes   = require('./routes/ElectionRoutes');
const voteRoutes       = require('./routes/voteRoutes');        // vote casting + results
const adminRoutes      = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const locationRoutes   = require('./routes/locationRoutes');
const voterRoutes      = require('./routes/VoterRoutes');       // capital V — matches your file

const pool = require('./config/db');
const { checkBlockchainConnection } = require('./config/blockchain');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Core routes ───────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/elections',   electionRoutes);
app.use('/api/votes',       voteRoutes);       // POST /api/votes/cast, /verify, GET /counts/:id
app.use('/api/voter',       voterRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/locations',   locationRoutes);

// ── Public live results (no auth — landing page preview) ─────
app.get('/api/live-results', async (req, res) => {
    try {
        const electionRow = await pool.query(
            `SELECT id, name, status FROM elections
             WHERE status IN ('active','results_published')
             AND start_date <= NOW() AND end_date >= NOW()
             ORDER BY start_date DESC LIMIT 1`
        );
        if (!electionRow.rows.length) {
            return res.json({ success: false, error: 'No active election' });
        }
        const electionId = electionRow.rows[0].id;

        const rows = await pool.query(
            `SELECT p.name AS pos_name, p.level, p.display_order,
                    c.name AS cand_name, c.symbol AS party,
                    COUNT(v.id) AS votes
             FROM positions p
             JOIN candidates c ON c.position_id = p.id AND c.election_id = $1 AND c.is_active = true
             LEFT JOIN votes v ON v.candidate_id = c.id AND v.election_id = $1
             GROUP BY p.id, p.name, p.level, p.display_order, c.id, c.name, c.symbol
             ORDER BY p.display_order, votes DESC`,
            [electionId]
        );

        // Build top-2 per position
        const positions = {};
        rows.rows.forEach(r => {
            if (!positions[r.pos_name]) positions[r.pos_name] = { level: r.level, order: r.display_order, candidates: [] };
            if (positions[r.pos_name].candidates.length < 2) {
                positions[r.pos_name].candidates.push({ name: r.cand_name, party: r.party, votes: parseInt(r.votes) });
            }
        });

        const totalRow = await pool.query(`SELECT COUNT(*) AS n FROM votes WHERE election_id = $1`, [electionId]);

        res.json({
            success: true,
            election: electionRow.rows[0],
            positions: Object.entries(positions)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([name, v]) => ({ name, level: v.level, candidates: v.candidates })),
            totalVotes: parseInt(totalRow.rows[0].n)
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ── Utility routes ────────────────────────────────────────────
app.get('/api/counties', async (req, res) => {
    try {
        const r = await pool.query('SELECT id, name, code FROM counties ORDER BY name');
        res.json({ success: true, counties: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/constituencies/:countyId', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT id, name, code FROM constituencies WHERE county_id = $1 ORDER BY name',
            [req.params.countyId]
        );
        res.json({ success: true, constituencies: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/wards/:constituencyId', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT id, name, code FROM wards WHERE constituency_id = $1 ORDER BY name',
            [req.params.constituencyId]
        );
        res.json({ success: true, wards: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/polling-stations/:wardId', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT id, name, code FROM polling_stations WHERE ward_id = $1 ORDER BY name',
            [req.params.wardId]
        );
        res.json({ success: true, pollingStations: r.rows });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
    try {
        const db = await pool.query('SELECT NOW()');
        const blockchain = await checkBlockchainConnection();
        res.json({
            status: 'OK',
            database: 'Connected',
            dbTime: db.rows[0].now,
            blockchain
        });
    } catch (e) {
        res.status(500).json({ status: 'Error', error: e.message });
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'IEBC Blockchain Voting System API v1.0.0',
        endpoints: {
            health:         'GET  /api/health',
            voterLogin:     'POST /api/auth/voter/login',
            activeElection: 'GET  /api/elections/active',
            castVote:       'POST /api/votes/cast',
            verifyVote:     'POST /api/votes/verify',
            results:        'GET  /api/elections/results/:id'
        }
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
    console.log(`\n✅ IEBC Backend running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log('\n📝 Key routes:');
    console.log('   POST /api/auth/voter/login');
    console.log('   GET  /api/elections/active');
    console.log('   POST /api/votes/cast        ← vote casting');
    console.log('   POST /api/votes/verify      ← vote verification');
    console.log('   GET  /api/elections/results/1 ← results\n');
});