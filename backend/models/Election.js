const pool = require('../config/db');

class Election {
    // Get active election
    static async getActiveElection() {
        const query = `
            SELECT * FROM elections 
            WHERE status = 'active' 
            AND start_date <= NOW() 
            AND end_date >= NOW()
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0];
    }

    // Get all positions for an election
    static async getPositionsWithCandidates(electionId) {
        const query = `
            SELECT p.*, 
                   json_agg(json_build_object('id', c.id, 'name', c.name, 'party', c.party)) as candidates
            FROM positions p
            LEFT JOIN candidates c ON p.id = c.position_id AND c.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id
            ORDER BY p.display_order
        `;
        const result = await pool.query(query, [electionId]);
        return result.rows;
    }

    // Get election results
    static async getResults(electionId) {
        const query = `
            SELECT 
                p.title as position,
                c.name as candidate,
                c.party,
                COUNT(v.id) as vote_count
            FROM positions p
            JOIN candidates c ON p.id = c.position_id
            LEFT JOIN votes v ON c.id = v.candidate_id AND v.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.title, c.id, c.name, c.party
            ORDER BY p.display_order, vote_count DESC
        `;
        const result = await pool.query(query, [electionId]);
        
        // Group results by position
        const grouped = {};
        result.rows.forEach(row => {
            if (!grouped[row.position]) {
                grouped[row.position] = [];
            }
            grouped[row.position].push({
                candidate: row.candidate,
                party: row.party,
                votes: parseInt(row.vote_count)
            });
        });
        return grouped;
    }
}

module.exports = Election;