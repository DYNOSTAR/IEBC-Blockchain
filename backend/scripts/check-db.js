const { query } = require('../config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database...\n');

    const tables = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    tables.rows.forEach((table) => {
      console.log(`   - ${table.table_name}`);
    });

    const counts = await query(`
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'counties', COUNT(*) FROM counties
      UNION ALL
      SELECT 'elections', COUNT(*) FROM elections
      UNION ALL
      SELECT 'positions', COUNT(*) FROM positions
      UNION ALL
      SELECT 'candidates', COUNT(*) FROM candidates
      UNION ALL
      SELECT 'voters', COUNT(*) FROM voters
      ORDER BY table_name;
    `);

    console.log('\n📈 Record counts:');
    counts.rows.forEach((row) => {
      console.log(`   ${row.table_name}: ${row.count}`);
    });

    const election = await query(`
      SELECT e.name, e.status,
             COUNT(DISTINCT p.id) as positions,
             COUNT(DISTINCT c.id) as candidates
      FROM elections e
      LEFT JOIN positions p ON p.election_id = e.id
      LEFT JOIN candidates c ON c.election_id = e.id
      GROUP BY e.id, e.name, e.status
      LIMIT 1;
    `);

    if (election.rows.length > 0) {
      console.log('\n🎯 Sample Election:');
      console.log(`   Name: ${election.rows[0].name}`);
      console.log(`   Status: ${election.rows[0].status}`);
      console.log(`   Positions: ${election.rows[0].positions}`);
      console.log(`   Candidates: ${election.rows[0].candidates}`);
    }

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
  process.exit();
}

checkDatabase();
