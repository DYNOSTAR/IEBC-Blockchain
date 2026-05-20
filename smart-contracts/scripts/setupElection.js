/**
 * setupElection.js
 * -----------------
 * Adds all candidates from the database to the blockchain and writes
 * each blockchain_candidate_id back to the DB.
 *
 * Run ONCE after seeding the database:
 *   node smart-contracts/scripts/setupElection.js
 *
 * Candidate order on the blockchain matches DB insertion order:
 *   Presidential (pos 1) → Governors (pos 2) → Senators (pos 3)
 *   → Women Reps (pos 5) → MPs (pos 4) → MCAs (pos 6)
 *   Within each position: sorted by county_id, constituency_id, ward_id, name
 */

const Web3 = require('web3');
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

// ── Load backend .env ────────────────────────────────────────────
try {
    const envFile = fs.readFileSync(path.resolve(__dirname, '../../backend/.env'), 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 1) return;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !(key in process.env)) process.env[key] = val;
    });
} catch { /* .env optional */ }

// ── DB connection ────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// ── Blockchain connection ────────────────────────────────────────
const contractInfo = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../abi/contract.json'), 'utf8')
);
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const web3     = new Web3(RPC_URL);

async function setupElection() {
    const client = await pool.connect();
    try {
        // ── Determine blockchain admin ───────────────────────────
        let admin;
        const pk = (process.env.SERVER_ETH_PRIVATE_KEY || '').replace('0x', '');
        if (process.env.SERVER_ETH_ADDRESS && pk.length === 64) {
            admin = process.env.SERVER_ETH_ADDRESS;
            web3.eth.accounts.wallet.add(process.env.SERVER_ETH_PRIVATE_KEY);
            console.log('Using SERVER_ETH_ADDRESS:', admin);
        } else {
            const accounts = await web3.eth.getAccounts();
            admin = accounts[0];
            console.log('Using Ganache accounts[0]:', admin);
        }

        const contract = new web3.eth.Contract(contractInfo.abi, contractInfo.address);

        // ── Fetch candidates from DB in a consistent order ───────
        // display_order controls position (1=President … 6=MCA).
        // Within each position, sort by location IDs then name so the
        // blockchain IDs stay deterministic across re-runs.
        const { rows } = await client.query(`
            SELECT c.id, c.name, c.party, c.symbol, c.county_id,
                   c.constituency_id, c.ward_id,
                   p.display_order AS pos_order,
                   p.level
            FROM candidates c
            JOIN positions p ON c.position_id = p.id
            WHERE c.is_active = true
            ORDER BY
                p.display_order,
                COALESCE(c.county_id,        0),
                COALESCE(c.constituency_id,  0),
                COALESCE(c.ward_id,          0),
                c.name
        `);

        if (!rows.length) {
            console.error('❌ No candidates found. Run seedDatabase.js first.');
            process.exit(1);
        }

        console.log(`\nAdding ${rows.length} candidates to blockchain…\n`);

        let blockchainSeq = 0; // tracks the ID the contract will assign

        for (const row of rows) {
            blockchainSeq++;

            // location ID for the smart contract:
            //   national   → 0
            //   county     → county_id
            //   constituency → constituency_id
            //   ward       → ward_id
            let locationId = 0;
            if (row.level === 'county')        locationId = row.county_id        || 0;
            if (row.level === 'constituency')  locationId = row.constituency_id  || 0;
            if (row.level === 'ward')          locationId = row.ward_id          || 0;

            const partyStr  = row.symbol || row.party || '';
            const symbolStr = row.symbol || '';

            try {
                const receipt = await contract.methods
                    .addCandidate(row.name, partyStr, symbolStr, row.pos_order, locationId)
                    .send({ from: admin, gas: 300000 });

                // Parse blockchain_candidate_id from event
                let chainId = blockchainSeq; // fallback: assume sequential
                const ev = receipt.events?.CandidateAdded;
                if (ev) {
                    const rv = ev.returnValues || ev;
                    chainId = parseInt(rv.candidateId ?? rv[0] ?? blockchainSeq);
                }

                // Write blockchain_candidate_id back to DB
                await client.query(
                    `UPDATE candidates SET blockchain_candidate_id = $1 WHERE id = $2`,
                    [chainId, row.id]
                );

                console.log(`  ✅ [${String(chainId).padStart(2)}] ${row.name} (pos ${row.pos_order}, loc ${locationId})`);
            } catch (err) {
                console.error(`  ❌ ${row.name}: ${err.message}`);
                // Don't abort — continue with remaining candidates
            }
        }

        // ── Activate election on the blockchain ──────────────────
        console.log('\nActivating election on blockchain…');
        try {
            await contract.methods.activateElection().send({ from: admin, gas: 200000 });
            console.log('✅ Election activated on blockchain!\n');
        } catch (err) {
            console.warn('⚠️  activateElection:', err.message, '(may already be active)\n');
        }

        console.log('🎉 Setup complete! The system is ready to accept votes.\n');
        console.log('📋 Verify with: node smart-contracts/scripts/verifySetup.js\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setupElection();
