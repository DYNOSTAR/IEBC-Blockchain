const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'Voting System API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      status: 'OK',
      message: 'Voting System API is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/elections', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*,
             json_agg(DISTINCT jsonb_build_object(
               'id', p.id,
               'name', p.name,
               'level', p.level,
               'candidates', (
                 SELECT json_agg(jsonb_build_object(
                   'id', c.id,
                   'name', c.name,
                   'party', c.party,
                   'partyColor', c.party_color
                 ))
                 FROM candidates c
                 WHERE c.position_id = p.id
               )
             )) as positions
      FROM elections e
      LEFT JOIN positions p ON p.election_id = e.id
      GROUP BY e.id
      ORDER BY e.start_date DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch elections' });
  }
});

app.get('/api/elections/:id', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT e.*,
             json_agg(DISTINCT jsonb_build_object(
               'id', p.id,
               'name', p.name,
               'level', p.level,
               'candidates', (
                 SELECT json_agg(jsonb_build_object(
                   'id', c.id,
                   'name', c.name,
                   'party', c.party,
                   'partyColor', c.party_color
                 ))
                 FROM candidates c
                 WHERE c.position_id = p.id
               )
             )) as positions
      FROM elections e
      LEFT JOIN positions p ON p.election_id = e.id
      WHERE e.id = $1
      GROUP BY e.id
    `,
      [req.params.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Election not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch election' });
  }
});

app.get('/api/counties', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM counties ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch counties' });
  }
});

app.post('/api/voter/verify', async (req, res) => {
  try {
    const { nationalId, firstName, lastName } = req.body;

    const result = await db.query('SELECT * FROM voters WHERE national_id = $1', [nationalId]);

    let voter;
    if (result.rows.length === 0) {
      const insertResult = await db.query(
        `INSERT INTO voters (national_id, first_name, last_name, date_of_birth, county, constituency, ward, polling_station)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          nationalId,
          firstName || 'Test',
          lastName || 'Voter',
          '1990-01-01',
          'Nairobi',
          'Kamukunji',
          'Eastleigh',
          'Eastleigh Primary',
        ],
      );
      voter = insertResult.rows[0];
    } else {
      voter = result.rows[0];
    }

    res.json({ success: true, data: voter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to verify voter' });
  }
});

app.post('/api/votes/cast', async (req, res) => {
  try {
    const { voterId, electionId, votes } = req.body;

    const txHash =
      '0x' +
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    for (const vote of votes) {
      await db.query(
        `INSERT INTO votes (voter_id, election_id, position_id, candidate_id, encrypted_vote, vote_hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [voterId, electionId, vote.positionId, vote.candidateId, 'encrypted_data', txHash],
      );
    }

    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [voterId, 'VOTE_CAST', JSON.stringify({ electionId, voteCount: votes.length }), req.ip],
    );

    res.json({
      success: true,
      data: {
        transactionHash: txHash,
        message: 'Vote recorded successfully',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to cast vote' });
  }
});

app.get('/api/results/:electionId', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        p.id as position_id,
        p.name as position_name,
        c.id as candidate_id,
        c.name as candidate_name,
        c.party,
        c.party_color,
        COUNT(v.id) as vote_count
      FROM positions p
      CROSS JOIN candidates c
      LEFT JOIN votes v ON v.candidate_id = c.id AND v.position_id = p.id
      WHERE p.election_id = $1 AND c.election_id = $1
      GROUP BY p.id, p.name, c.id, c.name, c.party, c.party_color
      ORDER BY p.name, vote_count DESC
    `,
      [req.params.electionId],
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch results' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
