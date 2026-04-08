const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545');

async function deploy() {
    try {
        // Get accounts from Ganache
        const accounts = await web3.eth.getAccounts();
        const adminAccount = accounts[0];
        
        console.log(`Deploying from account: ${adminAccount}`);
        console.log(`Account balance: ${await web3.eth.getBalance(adminAccount)} ETH`);
        
        // Read compiled contract
        const abi = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abi/Voting.json'), 'utf8'));
        const bytecode = fs.readFileSync(path.resolve(__dirname, '../bytecode/Voting.bin'), 'utf8');
        
        // Deploy contract
        console.log('\n📝 Deploying Voting contract...');
        
        const contract = new web3.eth.Contract(abi);
        const deployTx = contract.deploy({
            data: '0x' + bytecode,
        });
        
        const deployedContract = await deployTx.send({
            from: adminAccount,
            gas: 3000000,
        });
        
        console.log(`✅ Contract deployed to: ${deployedContract.options.address}`);
        
        // Save contract address
        fs.writeFileSync(
            path.resolve(__dirname, '../contract-address.json'),
            JSON.stringify({ address: deployedContract.options.address, abi: abi }, null, 2)
        );
        
        console.log('\n📋 Contract Address saved to: smart-contracts/contract-address.json');
        
        // Create a test election
        console.log('\n📝 Creating test election...');
        
        const startTime = Math.floor(Date.now() / 1000) - 86400; // Started yesterday
        const endTime = Math.floor(Date.now() / 1000) + 30 * 86400; // Ends in 30 days
        
        const createElectionTx = await deployedContract.methods.createElection(
            'Kenya General Election 2027',
            startTime,
            endTime
        ).send({ from: adminAccount, gas: 500000 });
        
        console.log('✅ Election created!');
        
        // Add positions
        const positions = [
            'President of Kenya',
            'County Governor',
            'Senator',
            'Member of Parliament',
            'Women Representative',
            'Member of County Assembly'
        ];
        
        for (const position of positions) {
            const addPositionTx = await deployedContract.methods.addPosition(1, position)
                .send({ from: adminAccount, gas: 500000 });
            console.log(`✅ Position added: ${position}`);
        }
        
        // Add candidates for President (position 1)
        const presidentialCandidates = [
            { name: 'William Ruto', party: 'UDA' },
            { name: 'Raila Odinga', party: 'ODM' },
            { name: 'Kalonzo Musyoka', party: 'Wiper' },
            { name: 'George Wajackoyah', party: 'Roots' }
        ];
        
        for (const candidate of presidentialCandidates) {
            await deployedContract.methods.addCandidate(1, 1, candidate.name, candidate.party)
                .send({ from: adminAccount, gas: 500000 });
            console.log(`✅ Candidate added: ${candidate.name} (${candidate.party})`);
        }
        
        // Activate election
        await deployedContract.methods.activateElection(1)
            .send({ from: adminAccount, gas: 500000 });
        console.log('\n✅ Election activated!');
        
        console.log('\n🎉 Deployment complete!');
        console.log(`Contract Address: ${deployedContract.options.address}`);
        console.log(`Election ID: 1`);
        
    } catch (error) {
        console.error('Deployment failed:', error);
    }
}

deploy();