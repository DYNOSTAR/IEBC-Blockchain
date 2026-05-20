const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
// Load backend .env without requiring the dotenv package
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
} catch { /* .env not found — continue with Ganache defaults */ }

const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(RPC_URL);

async function deploy() {
    try {
        const accounts = await web3.eth.getAccounts();

        // Prefer the server's configured address so the contract admin
        // matches the address that will later sign vote transactions.
        // Falls back to Ganache accounts[0] if the env vars are not set.
        let adminAccount;
        const pk = process.env.SERVER_ETH_PRIVATE_KEY || '';
        if (process.env.SERVER_ETH_ADDRESS && pk.replace('0x', '').length === 64) {
            adminAccount = process.env.SERVER_ETH_ADDRESS;
            web3.eth.accounts.wallet.add(pk);

            // Fund the server address from Ganache accounts[0] if balance is low
            const bal = BigInt(await web3.eth.getBalance(adminAccount));
            if (bal < BigInt(web3.utils.toWei('1', 'ether'))) {
                console.log('Funding server address from Ganache accounts[0]…');
                await web3.eth.sendTransaction({
                    from: accounts[0],
                    to: adminAccount,
                    value: web3.utils.toWei('10', 'ether'),
                    gas: 21000
                });
                console.log('Funded with 10 ETH');
            }
        } else {
            adminAccount = accounts[0];
            console.log('⚠️  SERVER_ETH_ADDRESS not set — deploying from Ganache accounts[0]');
            console.log('   Set SERVER_ETH_ADDRESS and SERVER_ETH_PRIVATE_KEY in backend/.env');
            console.log('   then redeploy so the admin matches the signing key.\n');
        }
        
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