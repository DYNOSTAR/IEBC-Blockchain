const bcrypt = require('bcryptjs');
const pool = require('../config/db');
require('dotenv').config();

// Seed function
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const voterPassword = await bcrypt.hash('voter123', 10);

        console.log('✓ Passwords hashed');

        // Insert admin user
        const adminUserResult = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            ['admin@iebc.or.ke', adminPassword, 'IEBC', 'Administrator', 'admin']
        );
        const adminUserId = adminUserResult.rows[0].id;
        console.log('✓ Admin user created (ID:', adminUserId, ')');

        // Insert admin record
        await pool.query(
            `INSERT INTO admins (user_id, position, department)
             VALUES ($1, $2, $3)`,
            [adminUserId, 'Chief Elections Officer', 'Elections Management']
        );
        console.log('✓ Admin record created');

        // Insert voter users
        const voters = [
            { email: 'voter1@iebc.or.ke', nationalId: '25874123', firstName: 'John', lastName: 'Kipchoge', county: 'Nairobi', constituency: 'Starehe', stationId: 1 },
            { email: 'voter2@iebc.or.ke', nationalId: '34521098', firstName: 'Jane', lastName: 'Wanjiru', county: 'Kiambu', constituency: 'Limuru', stationId: 2 },
            { email: 'voter3@iebc.or.ke', nationalId: '45632187', firstName: 'Ahmed', lastName: 'Hassan', county: 'Mombasa', constituency: 'Mombasa', stationId: 3 },
            { email: 'voter4@iebc.or.ke', nationalId: '56743298', firstName: 'Mary', lastName: 'Ochieng', county: 'Kisumu', constituency: 'Kisumu', stationId: 4 },
            { email: 'voter5@iebc.or.ke', nationalId: '67854309', firstName: 'David', lastName: 'Mutua', county: 'Makueni', constituency: 'Makueni', stationId: 5 }
        ];

        for (const voter of voters) {
            const userResult = await pool.query(
                `INSERT INTO users (email, password_hash, first_name, last_name, role)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id`,
                [voter.email, voterPassword, voter.firstName, voter.lastName, 'voter']
            );
            const userId = userResult.rows[0].id;

            await pool.query(
                `INSERT INTO voters (user_id, national_id, county, constituency, polling_station_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, voter.nationalId, voter.county, voter.constituency, voter.stationId]
            );
            console.log(`✓ Voter created: ${voter.firstName} ${voter.lastName} (${voter.nationalId})`);
        }

        // Insert candidates if not exists
        const candidatesCheck = await pool.query('SELECT COUNT(*) FROM candidates');
        if (candidatesCheck.rows[0].count === 0) {
            const candidates = [
                { name: 'John Kipchoge', party: 'Democratic Alliance', symbol: '🦁' },
                { name: 'Mary Wanjiru', party: 'Progressive Movement', symbol: '🌟' },
                { name: 'Ahmed Hassan', party: 'Unity Coalition', symbol: '🕊️' }
            ];

            for (const candidate of candidates) {
                await pool.query(
                    `INSERT INTO candidates (name, party, symbol)
                     VALUES ($1, $2, $3)`,
                    [candidate.name, candidate.party, candidate.symbol]
                );
                console.log(`✓ Candidate created: ${candidate.name}`);
            }
        }

        // Insert election if not exists
        const electionsCheck = await pool.query('SELECT COUNT(*) FROM elections');
        if (electionsCheck.rows[0].count === 0) {
            await pool.query(
                `INSERT INTO elections (name, status, start_date, end_date)
                 VALUES ($1, $2, $3, $4)`,
                ['2027 General Election', 'upcoming', '2027-08-09 08:00:00', '2027-08-09 17:00:00']
            );
            console.log('✓ Election created');
        }

        console.log('\n✅ Database seeding completed successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('Admin:');
        console.log('  Email: admin@iebc.or.ke');
        console.log('  Password: admin123');
        console.log('\nVoters:');
        console.log('  National ID: 25874123, Password: voter123');
        console.log('  National ID: 34521098, Password: voter123');
        console.log('  National ID: 45632187, Password: voter123');
        console.log('  National ID: 56743298, Password: voter123');
        console.log('  National ID: 67854309, Password: voter123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();
