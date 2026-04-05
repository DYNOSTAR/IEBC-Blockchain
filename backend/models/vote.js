const pool = require('../config/db');

class Vote {
    // Record vote in both database and blockchain
    static async castVote(voterId, electionId, positionId, candidateId, transactionHash) {
        const query = `
            INSERT INTO votes (voter_id, election_id, position_id, candidate_id, transaction_hash, timestamp)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *
        `;
        const values = [voterId, electionId, positionId, candidateId, transactionHash];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Get votes by election
    static async getVotesByElection(electionId) {
        const query = `
            SELECT v.*, c.name as candidate_name, p.title as position_title, 
                   u.first_name, u.last_name
            FROM votes v
            JOIN candidates c ON v.candidate_id = c.id
            JOIN positions p ON v.position_id = p.id
            JOIN voters vt ON v.voter_id = vt.id
            JOIN users u ON vt.user_id = u.id
            WHERE v.election_id = $1
        `;
        const result = await pool.query(query, [electionId]);
        return result.rows;
    }

    // Verify if voter has already voted for a specific position in an election
    static async hasVoted(voterId, electionId, positionId) {
        const query = `
            SELECT * FROM votes 
            WHERE voter_id = $1 AND election_id = $2 AND position_id = $3
        `;
        const result = await pool.query(query, [voterId, electionId, positionId]);
        return result.rows.length > 0;
    }
}

module.exports = Vote;