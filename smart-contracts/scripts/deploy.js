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
        
        console.log('Deploying from account:', adminAccount);
        const balance = await web3.eth.getBalance(adminAccount);
        console.log('Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
        
        // Read contract bytecode
        const bytecodePath = path.resolve(__dirname, '../abi/bytecode.bin');
        const bytecode = fs.readFileSync(bytecodePath, 'utf8');
        
        // Read contract ABI
        const abiPath = path.resolve(__dirname, '../abi/Voting.json');
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
        
        console.log('\n📝 Deploying Voting contract...');
        
        // Create contract instance
        const contract = new web3.eth.Contract(abi);
        
        // Deploy
        const deployTx = contract.deploy({
            data: '0x' + bytecode,
        });
        
        const deployedContract = await deployTx.send({
            from: adminAccount,
            gas: 3000000,
        });
        
        console.log('✅ Contract deployed to:', deployedContract.options.address);
        
        // Save contract address and ABI
        const contractInfo = {
            address: deployedContract.options.address,
            abi: abi,
            network: 'ganache',
            deployedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.resolve(__dirname, '../abi/contract.json'),
            JSON.stringify(contractInfo, null, 2)
        );
        
        console.log('\n📋 Contract Address saved to: smart-contracts/abi/contract.json');
        console.log('📍 Contract Address:', deployedContract.options.address);
        
        // Add positions to contract
        console.log('\n📝 Adding positions to contract...');
        
        const positions = [
            { name: 'President of Kenya', level: 'national' },
            { name: 'County Governor', level: 'county' },
            { name: 'Senator', level: 'county' },
            { name: 'Member of Parliament', level: 'constituency' },
            { name: 'Women Representative', level: 'county' },
            { name: 'Member of County Assembly', level: 'ward' }
        ];
        
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            try {
                const tx = await deployedContract.methods
                    .addPosition(pos.name, pos.level)
                    .send({ from: adminAccount, gas: 200000 });
                console.log(`✅ Position added: ${pos.name} (ID: ${i + 1})`);
            } catch (err) {
                console.log(`⚠️ Position ${pos.name} may already exist:`, err.message);
            }
        }
        
        console.log('\n🎉 Deployment complete!');
        console.log('Contract Address:', deployedContract.options.address);
        console.log('\n📝 Copy this address for your frontend:');
        console.log(deployedContract.options.address);
        
    } catch (error) {
        console.error('Deployment failed:', error);
    }
}

deploy();