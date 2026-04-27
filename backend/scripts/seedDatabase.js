require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🌱 Seeding database...');

        // ── Counties ────────────────────────────────────────────────────────────
        await client.query(`
            INSERT INTO counties (id, name) VALUES
            (1, 'Nairobi'), (2, 'Mombasa'), (3, 'Kisumu'), (4, 'Nakuru'), (5, 'Kiambu')
            ON CONFLICT (id) DO NOTHING
        `);
        console.log('✅ Counties seeded');

        // ── Admin user ──────────────────────────────────────────────────────────
        const adminPassword = await bcrypt.hash('Admin@2027', SALT_ROUNDS);
        const adminResult = await client.query(`
            INSERT INTO users (first_name, last_name, email, password, role, is_active)
            VALUES ('IEBC', 'Administrator', 'admin@iebc.go.ke', $1, 'admin', true)
            ON CONFLICT (email) DO UPDATE SET password = $1
            RETURNING id
        `, [adminPassword]);
        console.log('✅ Admin user seeded  (email: admin@iebc.go.ke  password: Admin@2027)');

        // ── Sample voter ────────────────────────────────────────────────────────
        const voterPassword = await bcrypt.hash('Voter@1234', SALT_ROUNDS);
        const voterUserResult = await client.query(`
            INSERT INTO users (first_name, last_name, email, password, role, is_active)
            VALUES ('John', 'Kamau', 'john.kamau@example.com', $1, 'voter', true)
            ON CONFLICT (email) DO UPDATE SET password = $1
            RETURNING id
        `, [voterPassword]);

        const voterUserId = voterUserResult.rows[0].id;
        await client.query(`
            INSERT INTO voters (user_id, national_id, county_id, polling_station_id, ward, has_voted)
            VALUES ($1, '12345678', 1, 'PS001', 'Westlands', false)
            ON CONFLICT (national_id) DO NOTHING
        `, [voterUserId]);
        console.log('✅ Sample voter seeded  (nationalId: 12345678  password: Voter@1234)');

        // ── Election ────────────────────────────────────────────────────────────
        const electionResult = await client.query(`
            INSERT INTO elections (name, description, status, start_date, end_date)
            VALUES (
                'Kenya General Election 2027',
                'General election for all elective positions under the Constitution of Kenya 2010',
                'active',
                NOW() - INTERVAL '1 hour',
                NOW() + INTERVAL '12 hours'
            )
            ON CONFLICT DO NOTHING
            RETURNING id
        `);

        let electionId;
        if (electionResult.rows.length > 0) {
            electionId = electionResult.rows[0].id;
        } else {
            const r = await client.query(`SELECT id FROM elections WHERE name = 'Kenya General Election 2027'`);
            electionId = r.rows[0].id;
        }
        console.log(`✅ Election seeded (id: ${electionId})`);

        // ── Positions ───────────────────────────────────────────────────────────
        const positions = [
            { title: 'President', level: 'national', display_order: 1 },
            { title: 'Governor', level: 'county', display_order: 2 },
            { title: 'Senator', level: 'county', display_order: 3 },
            { title: 'Member of Parliament', level: 'constituency', display_order: 4 },
            { title: 'Women Representative', level: 'county', display_order: 5 },
            { title: 'Member of County Assembly', level: 'ward', display_order: 6 }
        ];

        const positionIds = {};
        for (const pos of positions) {
            const r = await client.query(`
                INSERT INTO positions (title, level, election_id, display_order)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT DO NOTHING
                RETURNING id
            `, [pos.title, pos.level, electionId, pos.display_order]);
            if (r.rows.length > 0) positionIds[pos.title] = r.rows[0].id;
        }
        // fetch any that already existed
        const posResult = await client.query(
            `SELECT id, title FROM positions WHERE election_id = $1`, [electionId]
        );
        posResult.rows.forEach(p => { positionIds[p.title] = positionIds[p.title] || p.id; });
        console.log('✅ Positions seeded');

        // ── Candidates (President) ───────────────────────────────────────────────
        const presidentialCandidates = [
            { name: 'Alice Wanjiru', party: 'United Democratic Alliance' },
            { name: 'Brian Omondi', party: 'Orange Democratic Movement' },
            { name: 'Carol Chebet', party: 'Wiper Democratic Movement' }
        ];

        const presidentPosId = positionIds['President'];
        if (presidentPosId) {
            for (const c of presidentialCandidates) {
                await client.query(`
                    INSERT INTO candidates (name, party, position_id, election_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [c.name, c.party, presidentPosId, electionId]);
            }
            console.log('✅ Presidential candidates seeded');
        }

        await client.query('COMMIT');
        console.log('\n🎉 Database seeded successfully!\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});