const pool = require('../config/db');

class Election {

    // Get active election
    static async getActiveElection() {
        const query = `
            SELECT *
            FROM elections
            WHERE status = 'active'
              AND start_date <= NOW()
              AND end_date >= NOW()
            ORDER BY id DESC
            LIMIT 1
        `;
        const result = await pool.query(query);
        return result.rows[0] || null;
    }

    // Get positions with candidates for an election
    // Uses actual column names: positions.name (not title), candidates.symbol (not party)
    static async getPositionsWithCandidates(electionId) {
        const query = `
            SELECT
                p.id,
                p.name           AS title,
                p.description,
                p.display_order,
                p.level,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id',          c.id,
                            'name',        c.name,
                            'party',       c.symbol,
                            'symbol',      c.symbol,
                            'description', c.description
                        )
                    ) FILTER (WHERE c.id IS NOT NULL AND c.is_active = true),
                    '[]'
                ) AS candidates
            FROM positions p
            LEFT JOIN candidates c
                ON c.position_id = p.id
               AND c.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.name, p.description, p.display_order, p.level
            ORDER BY p.display_order
        `;
        const result = await pool.query(query, [electionId]);
        return result.rows;
    }

    // Get election results grouped by position
    static async getResults(electionId) {
        const query = `
            SELECT
                p.name          AS position,
                c.name          AS candidate,
                c.symbol        AS party,
                COUNT(v.id)     AS vote_count
            FROM positions p
            JOIN candidates c
                ON c.position_id = p.id
               AND c.election_id = $1
            LEFT JOIN votes v
                ON v.candidate_id = c.id
               AND v.election_id = $1
            WHERE p.election_id = $1
            GROUP BY p.id, p.name, p.display_order, c.id, c.name, c.symbol
            ORDER BY p.display_order, vote_count DESC
        `;
        const result = await pool.query(query, [electionId]);

        const grouped = {};
        result.rows.forEach(row => {
            if (!grouped[row.position]) grouped[row.position] = [];
            grouped[row.position].push({
                candidate: row.candidate,
                party:     row.party,
                votes:     parseInt(row.vote_count)
            });
        });
        return grouped;
    }
}

module.exports = Election;