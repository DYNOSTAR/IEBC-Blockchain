require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🌱 Seeding database...\n');

        // ── Users ──────────────────────────────────────────────────────────────
        const adminPw  = await bcrypt.hash('Admin@2027',  SALT_ROUNDS);
        const voterPw  = await bcrypt.hash('Voter@1234',  SALT_ROUNDS);

        const adminRow = await client.query(`
            INSERT INTO users (first_name, last_name, email, password, role, is_active)
            VALUES ('IEBC', 'Administrator', 'admin@iebc.or.ke', $1, 'admin', true)
            ON CONFLICT (email) DO UPDATE SET password = $1
            RETURNING id
        `, [adminPw]);
        console.log('✅ Admin seeded  (email: admin@iebc.or.ke  password: Admin@2027)');

        // ── Counties ───────────────────────────────────────────────────────────
        await client.query(`
            INSERT INTO counties (name, code, population, registered_voters) VALUES
            ('Nairobi',  '047', 4397073, 2456789),
            ('Mombasa',  '001', 1208333,  567890),
            ('Kisumu',   '040', 1155574,  456789),
            ('Nakuru',   '032', 2163202,  789012),
            ('Kiambu',   '022', 2417735,  890123)
            ON CONFLICT (code) DO NOTHING
        `);
        const countyRows = await client.query(`SELECT id, name FROM counties ORDER BY id`);
        const countyId = {};
        countyRows.rows.forEach(r => { countyId[r.name] = r.id; });
        console.log('✅ Counties seeded:', Object.keys(countyId).join(', '));

        // ── Constituencies (2 per county) ──────────────────────────────────────
        await client.query(`
            INSERT INTO constituencies (name, county_id, code) VALUES
            ('Westlands',        ${countyId['Nairobi']},  'C-WL'),
            ('Kasarani',         ${countyId['Nairobi']},  'C-KS'),
            ('Mvita',            ${countyId['Mombasa']},  'C-MV'),
            ('Likoni',           ${countyId['Mombasa']},  'C-LK'),
            ('Kisumu Central',   ${countyId['Kisumu']},   'C-KC'),
            ('Kisumu East',      ${countyId['Kisumu']},   'C-KE'),
            ('Nakuru Town East', ${countyId['Nakuru']},   'C-NE'),
            ('Nakuru Town West', ${countyId['Nakuru']},   'C-NW'),
            ('Thika Town',       ${countyId['Kiambu']},   'C-TT'),
            ('Ruiru',            ${countyId['Kiambu']},   'C-RU')
            ON CONFLICT DO NOTHING
        `);
        const constRows = await client.query(`SELECT id, name FROM constituencies ORDER BY id`);
        const constId = {};
        constRows.rows.forEach(r => { constId[r.name] = r.id; });
        console.log('✅ Constituencies seeded:', Object.keys(constId).join(', '));

        // ── Wards (2 per constituency) ─────────────────────────────────────────
        await client.query(`
            INSERT INTO wards (name, constituency_id, code) VALUES
            ('Parklands',       ${constId['Westlands']},        'W-PL'),
            ('Highridge',       ${constId['Westlands']},        'W-HR'),
            ('Mirema',          ${constId['Kasarani']},         'W-MI'),
            ('Clay City',       ${constId['Kasarani']},         'W-CC'),
            ('Tudor',           ${constId['Mvita']},            'W-TD'),
            ('Tononoka',        ${constId['Mvita']},            'W-TN'),
            ('Mtongwe',         ${constId['Likoni']},           'W-MT'),
            ('Shika Adabu',     ${constId['Likoni']},           'W-SA'),
            ('Kondele',         ${constId['Kisumu Central']},   'W-KN'),
            ('Kaloleni',        ${constId['Kisumu Central']},   'W-KL'),
            ('Kolwa Central',   ${constId['Kisumu East']},      'W-KC'),
            ('Manyatta B',      ${constId['Kisumu East']},      'W-MB'),
            ('Biashara',        ${constId['Nakuru Town East']}, 'W-BN'),
            ('Kivumbini',       ${constId['Nakuru Town East']}, 'W-KV'),
            ('Kaptembwo',       ${constId['Nakuru Town West']}, 'W-KP'),
            ('Shauri Yako',     ${constId['Nakuru Town West']}, 'W-SY'),
            ('Kamenu',          ${constId['Thika Town']},       'W-KM'),
            ('Gatuanyaga',      ${constId['Thika Town']},       'W-GT'),
            ('Gitothua',        ${constId['Ruiru']},            'W-GH'),
            ('Biashara Ruiru',  ${constId['Ruiru']},            'W-BR')
            ON CONFLICT DO NOTHING
        `);
        const wardRows = await client.query(`SELECT id, name FROM wards ORDER BY id`);
        const wardId = {};
        wardRows.rows.forEach(r => { wardId[r.name] = r.id; });
        console.log('✅ Wards seeded:', Object.keys(wardId).join(', '));

        // ── Election ───────────────────────────────────────────────────────────
        const adminId = adminRow.rows[0].id;
        let electionId;
        const elRes = await client.query(`
            INSERT INTO elections (name, description, status, start_date, end_date, created_by)
            VALUES (
                'Kenya General Election 2027',
                'General election for President, Governors, Senators, MPs, Women Representatives and MCAs',
                'active',
                NOW() - INTERVAL '1 hour',
                NOW() + INTERVAL '12 hours',
                $1
            )
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [adminId]);
        if (elRes.rows.length > 0) {
            electionId = elRes.rows[0].id;
        } else {
            const r = await client.query(`SELECT id FROM elections WHERE name = 'Kenya General Election 2027'`);
            electionId = r.rows[0].id;
        }
        console.log(`✅ Election seeded (id: ${electionId})`);

        // ── Positions ──────────────────────────────────────────────────────────
        const positionDefs = [
            { name: 'President of Kenya',        level: 'national',      display_order: 1 },
            { name: 'Governor',                  level: 'county',        display_order: 2 },
            { name: 'Senator',                   level: 'county',        display_order: 3 },
            { name: 'Member of Parliament',      level: 'constituency',  display_order: 4 },
            { name: 'Women Representative',      level: 'county',        display_order: 5 },
            { name: 'Member of County Assembly', level: 'ward',          display_order: 6 }
        ];
        const posId = {};
        for (const p of positionDefs) {
            const r = await client.query(`
                INSERT INTO positions (election_id, name, description, display_order, level)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
                RETURNING id
            `, [electionId, p.name, `Vote for your ${p.name}`, p.display_order, p.level]);
            if (r.rows.length > 0) {
                posId[p.name] = r.rows[0].id;
            } else {
                const ex = await client.query(
                    `SELECT id FROM positions WHERE election_id=$1 AND name=$2`, [electionId, p.name]
                );
                posId[p.name] = ex.rows[0].id;
            }
        }
        console.log('✅ Positions seeded');

        // Helper: insert candidate if not already present
        async function addCandidate(name, party, posName, countyIdVal, constIdVal, wardIdVal) {
            await client.query(`
                INSERT INTO candidates
                    (election_id, position_id, name, party, symbol, description, is_active,
                     county_id, constituency_id, ward_id)
                VALUES ($1, $2, $3, $4, $4, $5, true, $6, $7, $8)
                ON CONFLICT DO NOTHING
            `, [electionId, posId[posName], name, party,
                `${party} candidate for ${posName}`,
                countyIdVal || null, constIdVal || null, wardIdVal || null]);
        }

        // ── Presidential (national, no location) ──────────────────────────────
        await addCandidate('William Ruto',      'UDA',   'President of Kenya', null, null, null);
        await addCandidate('Raila Odinga',      'ODM',   'President of Kenya', null, null, null);
        await addCandidate('Kalonzo Musyoka',   'Wiper', 'President of Kenya', null, null, null);
        await addCandidate('George Wajackoyah', 'Roots', 'President of Kenya', null, null, null);

        // ── Governors (county_id required) ────────────────────────────────────
        await addCandidate('Johnson Sakaja',    'UDA',     'Governor', countyId['Nairobi'],  null, null);
        await addCandidate('Timothy Wanyonyi',  'ODM',     'Governor', countyId['Nairobi'],  null, null);
        await addCandidate("Abdulswamad Nassir",'ODM',     'Governor', countyId['Mombasa'],  null, null);
        await addCandidate('Hassan Omar Hassan','Jubilee',  'Governor', countyId['Mombasa'],  null, null);
        await addCandidate("Anyang' Nyong'o",   'ODM',     'Governor', countyId['Kisumu'],   null, null);
        await addCandidate('Jane Akinyi',        'UDA',    'Governor', countyId['Kisumu'],   null, null);
        await addCandidate('Susan Kihika',       'UDA',    'Governor', countyId['Nakuru'],   null, null);
        await addCandidate('Lee Kinyanjui',      'Jubilee','Governor', countyId['Nakuru'],   null, null);
        await addCandidate('Kimani Wamatangi',   'UDA',    'Governor', countyId['Kiambu'],   null, null);
        await addCandidate('Grace Waruguru',     'Jubilee','Governor', countyId['Kiambu'],   null, null);

        // ── Senators (county_id required) ─────────────────────────────────────
        await addCandidate('Edwin Sifuna',      'ODM',    'Senator', countyId['Nairobi'],  null, null);
        await addCandidate('Millicent Omanga',  'UDA',    'Senator', countyId['Nairobi'],  null, null);
        await addCandidate('Mohamed Faki',      'ODM',    'Senator', countyId['Mombasa'],  null, null);
        await addCandidate('Rashid Bedzimba',   'Jubilee','Senator', countyId['Mombasa'],  null, null);
        await addCandidate('Oburu Oginga',      'ODM',    'Senator', countyId['Kisumu'],   null, null);
        await addCandidate('Alice Otieno',      'UDA',    'Senator', countyId['Kisumu'],   null, null);
        await addCandidate('Samson Cherargei',  'UDA',    'Senator', countyId['Nakuru'],   null, null);
        await addCandidate('Kioni Ndungu',      'Jubilee','Senator', countyId['Nakuru'],   null, null);
        await addCandidate("Karungo Thang'wa",  'UDA',    'Senator', countyId['Kiambu'],   null, null);
        await addCandidate('Mary Wanjiku',      'ODM',    'Senator', countyId['Kiambu'],   null, null);

        // ── Women Reps (county_id required) ───────────────────────────────────
        await addCandidate('Esther Passaris',   'ODM',    'Women Representative', countyId['Nairobi'],  null, null);
        await addCandidate('Rachel Shebesh',    'UDA',    'Women Representative', countyId['Nairobi'],  null, null);
        await addCandidate('Asha Hussein',      'ODM',    'Women Representative', countyId['Mombasa'],  null, null);
        await addCandidate('Amina Mohamed',     'Jubilee','Women Representative', countyId['Mombasa'],  null, null);
        await addCandidate('Linet Toto',        'UDA',    'Women Representative', countyId['Kisumu'],   null, null);
        await addCandidate('Ruth Odinga',       'ODM',    'Women Representative', countyId['Kisumu'],   null, null);
        await addCandidate('Liza Chelule',      'UDA',    'Women Representative', countyId['Nakuru'],   null, null);
        await addCandidate('Hellen Chepkwony',  'Jubilee','Women Representative', countyId['Nakuru'],   null, null);
        await addCandidate("Alice Ng'ang'a",    'Jubilee','Women Representative', countyId['Kiambu'],   null, null);
        await addCandidate('Lydia Githiomi',    'UDA',    'Women Representative', countyId['Kiambu'],   null, null);

        // ── MPs (constituency_id required) ────────────────────────────────────
        await addCandidate('Tim Wanyonyi',          'ODM',    'Member of Parliament', countyId['Nairobi'],  constId['Westlands'],        null);
        await addCandidate('Jane Wangechi',         'UDA',    'Member of Parliament', countyId['Nairobi'],  constId['Westlands'],        null);
        await addCandidate('Ronald Karauri',        'UDA',    'Member of Parliament', countyId['Nairobi'],  constId['Kasarani'],         null);
        await addCandidate('Peter Kariuki',         'ODM',    'Member of Parliament', countyId['Nairobi'],  constId['Kasarani'],         null);
        await addCandidate('Abdulrahman Wandati',   'ODM',    'Member of Parliament', countyId['Mombasa'],  constId['Mvita'],            null);
        await addCandidate('Ali Mwangi',            'Jubilee','Member of Parliament', countyId['Mombasa'],  constId['Mvita'],            null);
        await addCandidate('Mishi Mboko',           'ODM',    'Member of Parliament', countyId['Mombasa'],  constId['Likoni'],           null);
        await addCandidate('Hassan Joho',           'Jubilee','Member of Parliament', countyId['Mombasa'],  constId['Likoni'],           null);
        await addCandidate('Joshua Oron',           'ODM',    'Member of Parliament', countyId['Kisumu'],   constId['Kisumu Central'],   null);
        await addCandidate('Peter Owino',           'UDA',    'Member of Parliament', countyId['Kisumu'],   constId['Kisumu Central'],   null);
        await addCandidate('Shakeel Shabbir',       'ODM',    'Member of Parliament', countyId['Kisumu'],   constId['Kisumu East'],      null);
        await addCandidate('Mary Achieng',          'UDA',    'Member of Parliament', countyId['Kisumu'],   constId['Kisumu East'],      null);
        await addCandidate('David Gikaria',         'Jubilee','Member of Parliament', countyId['Nakuru'],   constId['Nakuru Town East'], null);
        await addCandidate("Anne Ng'ang'a",         'UDA',    'Member of Parliament', countyId['Nakuru'],   constId['Nakuru Town East'], null);
        await addCandidate('Samuel Arama',          'UDA',    'Member of Parliament', countyId['Nakuru'],   constId['Nakuru Town West'], null);
        await addCandidate('Grace Chepkurui',       'Jubilee','Member of Parliament', countyId['Nakuru'],   constId['Nakuru Town West'], null);
        await addCandidate('Patrick Wainaina',      'UDA',    'Member of Parliament', countyId['Kiambu'],   constId['Thika Town'],       null);
        await addCandidate('Alice Kinuthia',        'Jubilee','Member of Parliament', countyId['Kiambu'],   constId['Thika Town'],       null);
        await addCandidate("Simon King'ara",        'UDA',    'Member of Parliament', countyId['Kiambu'],   constId['Ruiru'],            null);
        await addCandidate('Jane Njeri',            'ODM',    'Member of Parliament', countyId['Kiambu'],   constId['Ruiru'],            null);

        // ── MCAs (ward_id + constituency_id + county_id required) ─────────────
        const mcaPos = 'Member of County Assembly';
        // Nairobi / Westlands
        await addCandidate('James Njoroge',     'UDA', mcaPos, countyId['Nairobi'],  constId['Westlands'],        wardId['Parklands']);
        await addCandidate('Lucy Wanjiru',      'ODM', mcaPos, countyId['Nairobi'],  constId['Westlands'],        wardId['Parklands']);
        await addCandidate('Peter Kamau',       'UDA', mcaPos, countyId['Nairobi'],  constId['Westlands'],        wardId['Highridge']);
        await addCandidate('Alice Mwangi',      'ODM', mcaPos, countyId['Nairobi'],  constId['Westlands'],        wardId['Highridge']);
        // Nairobi / Kasarani
        await addCandidate('John Karanja',      'ODM', mcaPos, countyId['Nairobi'],  constId['Kasarani'],         wardId['Mirema']);
        await addCandidate('Sarah Otieno',      'UDA', mcaPos, countyId['Nairobi'],  constId['Kasarani'],         wardId['Mirema']);
        await addCandidate('Michael Mutua',     'UDA', mcaPos, countyId['Nairobi'],  constId['Kasarani'],         wardId['Clay City']);
        await addCandidate('Jane Njoki',     'Jubilee', mcaPos, countyId['Nairobi'], constId['Kasarani'],         wardId['Clay City']);
        // Mombasa / Mvita
        await addCandidate('Ahmed Omar',     'ODM',     mcaPos, countyId['Mombasa'], constId['Mvita'],            wardId['Tudor']);
        await addCandidate('Fatuma Said',    'Jubilee',  mcaPos, countyId['Mombasa'],constId['Mvita'],            wardId['Tudor']);
        await addCandidate('Ali Hassan',     'ODM',     mcaPos, countyId['Mombasa'], constId['Mvita'],            wardId['Tononoka']);
        await addCandidate('Mwanaisha Ali',  'Jubilee',  mcaPos, countyId['Mombasa'],constId['Mvita'],            wardId['Tononoka']);
        // Mombasa / Likoni
        await addCandidate('Suleiman Dori',  'ODM',     mcaPos, countyId['Mombasa'], constId['Likoni'],           wardId['Mtongwe']);
        await addCandidate('Hadija Mohamed', 'Jubilee',  mcaPos, countyId['Mombasa'],constId['Likoni'],           wardId['Mtongwe']);
        await addCandidate('Rashid Katana',  'Jubilee',  mcaPos, countyId['Mombasa'],constId['Likoni'],           wardId['Shika Adabu']);
        await addCandidate('Amina Soud',     'ODM',     mcaPos, countyId['Mombasa'], constId['Likoni'],           wardId['Shika Adabu']);
        // Kisumu / Kisumu Central
        await addCandidate('Fredrick Ochieng','ODM',    mcaPos, countyId['Kisumu'],  constId['Kisumu Central'],   wardId['Kondele']);
        await addCandidate('Grace Aloo',      'UDA',    mcaPos, countyId['Kisumu'],  constId['Kisumu Central'],   wardId['Kondele']);
        await addCandidate('Vincent Otieno',  'ODM',    mcaPos, countyId['Kisumu'],  constId['Kisumu Central'],   wardId['Kaloleni']);
        await addCandidate('Margaret Adhiambo','UDA',   mcaPos, countyId['Kisumu'],  constId['Kisumu Central'],   wardId['Kaloleni']);
        // Kisumu / Kisumu East
        await addCandidate('Charles Onyango', 'ODM',   mcaPos, countyId['Kisumu'],   constId['Kisumu East'],      wardId['Kolwa Central']);
        await addCandidate('Beatrice Akinyi', 'UDA',   mcaPos, countyId['Kisumu'],   constId['Kisumu East'],      wardId['Kolwa Central']);
        await addCandidate('Samuel Oloo',     'ODM',   mcaPos, countyId['Kisumu'],   constId['Kisumu East'],      wardId['Manyatta B']);
        await addCandidate('Patricia Were',   'UDA',   mcaPos, countyId['Kisumu'],   constId['Kisumu East'],      wardId['Manyatta B']);
        // Nakuru / Nakuru Town East
        await addCandidate('David Kimutai',       'UDA',     mcaPos, countyId['Nakuru'],  constId['Nakuru Town East'], wardId['Biashara']);
        await addCandidate('Elizabeth Chepkorir', 'Jubilee', mcaPos, countyId['Nakuru'],  constId['Nakuru Town East'], wardId['Biashara']);
        await addCandidate('Joseph Nganga',        'Jubilee', mcaPos, countyId['Nakuru'],  constId['Nakuru Town East'], wardId['Kivumbini']);
        await addCandidate('Catherine Wanjiku',    'UDA',    mcaPos, countyId['Nakuru'],  constId['Nakuru Town East'], wardId['Kivumbini']);
        // Nakuru / Nakuru Town West
        await addCandidate('Robert Koech',   'UDA',     mcaPos, countyId['Nakuru'],  constId['Nakuru Town West'], wardId['Kaptembwo']);
        await addCandidate('Dorcas Chebii',  'Jubilee', mcaPos, countyId['Nakuru'],  constId['Nakuru Town West'], wardId['Kaptembwo']);
        await addCandidate('Stephen Mutai',  'UDA',     mcaPos, countyId['Nakuru'],  constId['Nakuru Town West'], wardId['Shauri Yako']);
        await addCandidate('Nancy Rotich',   'Jubilee', mcaPos, countyId['Nakuru'],  constId['Nakuru Town West'], wardId['Shauri Yako']);
        // Kiambu / Thika Town
        await addCandidate('Paul Muigai',    'UDA',     mcaPos, countyId['Kiambu'],  constId['Thika Town'],       wardId['Kamenu']);
        await addCandidate('Hannah Wanjiru', 'Jubilee', mcaPos, countyId['Kiambu'],  constId['Thika Town'],       wardId['Kamenu']);
        await addCandidate('George Kamau',   'Jubilee', mcaPos, countyId['Kiambu'],  constId['Thika Town'],       wardId['Gatuanyaga']);
        await addCandidate('Rose Njeri',     'UDA',     mcaPos, countyId['Kiambu'],  constId['Thika Town'],       wardId['Gatuanyaga']);
        // Kiambu / Ruiru
        await addCandidate('Daniel Mwangi',  'UDA',     mcaPos, countyId['Kiambu'],  constId['Ruiru'],            wardId['Gitothua']);
        await addCandidate('Joyce Njoki',    'Jubilee', mcaPos, countyId['Kiambu'],  constId['Ruiru'],            wardId['Gitothua']);
        await addCandidate('Simon Kariuki',  'Jubilee', mcaPos, countyId['Kiambu'],  constId['Ruiru'],            wardId['Biashara Ruiru']);
        await addCandidate('Ann Njuguna',    'UDA',     mcaPos, countyId['Kiambu'],  constId['Ruiru'],            wardId['Biashara Ruiru']);

        console.log('✅ All candidates seeded (4 presidential, 10 governors, 10 senators, 10 women reps, 20 MPs, 40 MCAs)');

        // ── Sample Voters ──────────────────────────────────────────────────────
        const sampleVoters = [
            {
                first: 'John', last: 'Kamau', email: 'john.kamau@example.com',
                national_id: '12345678', ps: 'PS001',
                county: 'Nairobi', constituency: 'Westlands', ward: 'Parklands'
            },
            {
                first: 'Jane', last: 'Wanjiku', email: 'jane.wanjiku@example.com',
                national_id: '87654321', ps: 'PS002',
                county: 'Nairobi', constituency: 'Kasarani', ward: 'Mirema'
            },
            {
                first: 'Peter', last: 'Omondi', email: 'peter.omondi@example.com',
                national_id: '11223344', ps: 'PS003',
                county: 'Mombasa', constituency: 'Mvita', ward: 'Tudor'
            },
            {
                first: 'Mary', last: 'Chebet', email: 'mary.chebet@example.com',
                national_id: '44332211', ps: 'PS004',
                county: 'Kisumu', constituency: 'Kisumu Central', ward: 'Kondele'
            }
        ];

        for (const v of sampleVoters) {
            const userRes = await client.query(`
                INSERT INTO users (first_name, last_name, email, national_id, password, role, is_active)
                VALUES ($1, $2, $3, $4, $5, 'voter', true)
                ON CONFLICT (email) DO UPDATE SET national_id = $4
                RETURNING id
            `, [v.first, v.last, v.email, v.national_id, voterPw]);

            const uid = userRes.rows[0].id;
            await client.query(`
                INSERT INTO voters
                    (user_id, national_id, polling_station_id, county_id, constituency_id, ward_id, has_voted)
                VALUES ($1, $2, $3, $4, $5, $6, false)
                ON CONFLICT (national_id) DO UPDATE
                    SET county_id = $4, constituency_id = $5, ward_id = $6
            `, [uid, v.national_id, v.ps,
                countyId[v.county], constId[v.constituency], wardId[v.ward]]);

            console.log(`✅ Voter: ${v.first} ${v.last} — ${v.county} / ${v.constituency} / ${v.ward}  (nationalId: ${v.national_id})`);
        }

        await client.query('COMMIT');
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Credentials:');
        console.log('   Admin:  admin@iebc.or.ke        / Admin@2027');
        console.log('   Voters: <nationalId>            / Voter@1234');
        console.log('\n⚠️  Run: node smart-contracts/scripts/setupElection.js  to register candidates on the blockchain.\n');

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
