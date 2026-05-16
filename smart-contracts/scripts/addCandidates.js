const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load contract info
const contractInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abi/contract.json'), 'utf8'));
const CONTRACT_ADDRESS = contractInfo.address;
const ABI = contractInfo.abi;

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545');

async function addCandidates() {
    try {
        const accounts = await web3.eth.getAccounts();
        const adminAccount = accounts[0];
        
        console.log('Adding candidates from account:', adminAccount);
        
        const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);
        
        // ============================================
        // POSITION IDs:
        // 1 = President of Kenya (national)
        // 2 = County Governor (county)
        // 3 = Senator (county)
        // 4 = Member of Parliament (constituency)
        // 5 = Women Representative (county)
        // 6 = Member of County Assembly (ward)
        // ============================================
        
        // Nairobi County ID = 1 (from your database)
        // Nairobi, Starehe Constituency ID = 16
        // Nairobi Central Ward ID = 56
        
        console.log('\n📝 Adding Presidential Candidates (Position 1)...');
        
        // Presidential candidates (locationId = 0 for national)
        const presidents = [
            { name: 'William Ruto', party: 'UDA', symbol: '🟢', positionId: 1, locationId: 0 },
            { name: 'Raila Odinga', party: 'ODM', symbol: '🔴', positionId: 1, locationId: 0 },
            { name: 'Kalonzo Musyoka', party: 'Wiper', symbol: '🟡', positionId: 1, locationId: 0 },
            { name: 'George Wajackoyah', party: 'Roots', symbol: '🌿', positionId: 1, locationId: 0 }
        ];
        
        for (const candidate of presidents) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n📝 Adding Nairobi County Governor Candidates (Position 2, County ID: 1)...');
        
        // County Governor candidates (locationId = 1 for Nairobi)
        const governors = [
            { name: 'Johnson Sakaja', party: 'UDA', symbol: '🏗️', positionId: 2, locationId: 1 },
            { name: 'Timothy Wanyonyi', party: 'ODM', symbol: '🤝', positionId: 2, locationId: 1 },
            { name: 'Esther Passaris', party: 'ODM', symbol: '⭐', positionId: 2, locationId: 1 }
        ];
        
        for (const candidate of governors) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n📝 Adding Nairobi Senator Candidates (Position 3, County ID: 1)...');
        
        const senators = [
            { name: 'Edwin Sifuna', party: 'ODM', symbol: '📚', positionId: 3, locationId: 1 },
            { name: 'Millicent Omanga', party: 'UDA', symbol: '💪', positionId: 3, locationId: 1 }
        ];
        
        for (const candidate of senators) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n📝 Adding Nairobi Women Rep Candidates (Position 5, County ID: 1)...');
        
        const womenReps = [
            { name: 'Esther Passaris', party: 'ODM', symbol: '👩‍⚖️', positionId: 5, locationId: 1 },
            { name: 'Rachel Shebesh', party: 'UDA', symbol: '🏛️', positionId: 5, locationId: 1 }
        ];
        
        for (const candidate of womenReps) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n📝 Adding MP Candidates for Starehe Constituency (Position 4, Constituency ID: 16)...');
        
        const mps = [
            { name: 'John Doe', party: 'UDA', symbol: '📋', positionId: 4, locationId: 16 },
            { name: 'Jane Smith', party: 'ODM', symbol: '🌹', positionId: 4, locationId: 16 }
        ];
        
        for (const candidate of mps) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n📝 Adding MCA Candidates for Nairobi Central Ward (Position 6, Ward ID: 56)...');
        
        const mcas = [
            { name: 'James Mwangi', party: 'UDA', symbol: '🏘️', positionId: 6, locationId: 56 },
            { name: 'Lucy Wanjiku', party: 'ODM', symbol: '🏥', positionId: 6, locationId: 56 }
        ];
        
        for (const candidate of mcas) {
            try {
                const tx = await contract.methods
                    .addCandidate(candidate.name, candidate.party, candidate.symbol, candidate.positionId, candidate.locationId)
                    .send({ from: adminAccount, gas: 300000 });
                console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
            } catch (err) {
                console.log(`⚠️ Could not add ${candidate.name}: ${err.message}`);
            }
        }
        
        console.log('\n🎉 All candidates added successfully!');
        
    } catch (error) {
        console.error('Error adding candidates:', error);
    }
}

addCandidates();