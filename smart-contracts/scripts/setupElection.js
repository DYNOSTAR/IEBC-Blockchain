const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load backend .env
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
} catch { }

const contractInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abi/contract.json'), 'utf8'));
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(RPC_URL);

async function setupElection() {
    try {
        const accounts = await web3.eth.getAccounts();

        // Use server address if configured, otherwise fall back to Ganache accounts[0]
        let admin;
        const pk = (process.env.SERVER_ETH_PRIVATE_KEY || '').replace('0x', '');
        if (process.env.SERVER_ETH_ADDRESS && pk.length === 64) {
            admin = process.env.SERVER_ETH_ADDRESS;
            web3.eth.accounts.wallet.add(process.env.SERVER_ETH_PRIVATE_KEY);
            console.log('Using SERVER_ETH_ADDRESS as admin:', admin);
        } else {
            admin = accounts[0];
            console.log('Using Ganache accounts[0] as admin:', admin);
        }

        const contract = new web3.eth.Contract(contractInfo.abi, contractInfo.address);
        
        console.log('Setting up election...');
        console.log('Admin account:', admin);
        
        // Add all candidates
        const candidates = [
            // President (national - locationId 0)
            { name: 'William Ruto', party: 'UDA', symbol: '🟢', pos: 1, loc: 0 },
            { name: 'Raila Odinga', party: 'ODM', symbol: '🔴', pos: 1, loc: 0 },
            { name: 'Kalonzo Musyoka', party: 'Wiper', symbol: '🟡', pos: 1, loc: 0 },
            // Governor Nairobi (county 1)
            { name: 'Johnson Sakaja', party: 'UDA', symbol: '🏗️', pos: 2, loc: 1 },
            { name: 'Timothy Wanyonyi', party: 'ODM', symbol: '🤝', pos: 2, loc: 1 },
            // Senator Nairobi (county 1)
            { name: 'Edwin Sifuna', party: 'ODM', symbol: '📚', pos: 3, loc: 1 },
            { name: 'Millicent Omanga', party: 'UDA', symbol: '💪', pos: 3, loc: 1 },
            // Women Rep Nairobi (county 1)
            { name: 'Esther Passaris', party: 'ODM', symbol: '👩‍⚖️', pos: 5, loc: 1 },
            { name: 'Rachel Shebesh', party: 'UDA', symbol: '🏛️', pos: 5, loc: 1 },
            // MP Starehe (constituency 16)
            { name: 'John Doe', party: 'UDA', symbol: '📋', pos: 4, loc: 16 },
            { name: 'Jane Smith', party: 'ODM', symbol: '🌹', pos: 4, loc: 16 },
            // MCA Nairobi Central (ward 56)
            { name: 'James Mwangi', party: 'UDA', symbol: '🏘️', pos: 6, loc: 56 },
            { name: 'Lucy Wanjiku', party: 'ODM', symbol: '🏥', pos: 6, loc: 56 }
        ];
        
        for (const c of candidates) {
            try {
                await contract.methods.addCandidate(c.name, c.party, c.symbol, c.pos, c.loc)
                    .send({ from: admin, gas: 300000 });
                console.log(`✅ Added: ${c.name} (Position ${c.pos})`);
            } catch (err) {
                console.log(`⚠️ ${c.name}: ${err.message}`);
            }
        }
        
        // Activate election
        await contract.methods.activateElection().send({ from: admin, gas: 200000 });
        console.log('\n✅ Election activated!');
        
        console.log('\n🎉 Setup complete! You can now vote.');
        
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupElection();