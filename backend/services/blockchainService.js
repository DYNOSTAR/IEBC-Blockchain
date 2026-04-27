const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// ── Load contract ─────────────────────────────────────────────
let contractAddress = null;
let contractABI = null;

const contractPath = path.resolve(__dirname, '../../smart-contracts/contract-address.json');
try {
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    contractAddress = contractData.address;
    contractABI = contractData.abi;
    console.log('📦 Voting contract loaded:', contractAddress);
} catch {
    console.warn('⚠️  Contract not found at', contractPath);
    console.warn('   Run: cd smart-contracts && npx hardhat run scripts/deploy.js --network ganache');
}

// ── Web3 connection ───────────────────────────────────────────
const GANACHE_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(GANACHE_URL);

// Server account — signs ALL transactions (from Ganache accounts tab)
const SERVER_ADDRESS     = process.env.SERVER_ETH_ADDRESS;
const SERVER_PRIVATE_KEY = process.env.SERVER_ETH_PRIVATE_KEY;

let votingContract = null;
if (contractAddress && contractABI) {
    votingContract = new web3.eth.Contract(contractABI, contractAddress);
}

// ── Helpers ───────────────────────────────────────────────────
function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'V-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// ── Cast vote on blockchain ───────────────────────────────────
async function castVoteOnBlockchain(electionId, positionId, candidateId) {
    const verificationCode = generateVerificationCode();

    // If contract not deployed yet, return a simulated result for development
    if (!votingContract || !SERVER_ADDRESS || !SERVER_PRIVATE_KEY) {
        console.warn('⚠️  Blockchain not configured — using simulated transaction');
        return {
            success: true,
            simulated: true,
            transactionHash: '0x' + require('crypto').randomBytes(32).toString('hex'),
            verificationCode,
            blockNumber: Math.floor(Math.random() * 1000000) + 18000000
        };
    }

    try {
        const txData = votingContract.methods
            .vote(electionId, positionId, candidateId, verificationCode)
            .encodeABI();

        const gasEstimate = await web3.eth.estimateGas({
            from: SERVER_ADDRESS,
            to: contractAddress,
            data: txData
        });

        const gasPrice = await web3.eth.getGasPrice();

        const signedTx = await web3.eth.accounts.signTransaction(
            {
                from: SERVER_ADDRESS,
                to: contractAddress,
                data: txData,
                gas: Math.ceil(Number(gasEstimate) * 1.2),
                gasPrice
            },
            SERVER_PRIVATE_KEY
        );

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        return {
            success: true,
            simulated: false,
            transactionHash: receipt.transactionHash,
            verificationCode,
            blockNumber: Number(receipt.blockNumber)
        };

    } catch (error) {
        console.error('Blockchain castVote error:', error.message);
        return { success: false, error: error.message };
    }
}

// ── Get vote count ────────────────────────────────────────────
async function getBlockchainVoteCount(electionId, positionId, candidateId) {
    if (!votingContract) return 0;
    try {
        const count = await votingContract.methods
            .getVoteCount(electionId, positionId, candidateId)
            .call();
        return parseInt(count);
    } catch (error) {
        console.error('getBlockchainVoteCount error:', error.message);
        return 0;
    }
}

// ── Verify vote code on-chain ─────────────────────────────────
async function verifyVoteOnChain(verificationCode) {
    if (!votingContract) return false;
    try {
        return await votingContract.methods.verifyVoteCode(verificationCode).call();
    } catch (error) {
        console.error('verifyVoteOnChain error:', error.message);
        return false;
    }
}

// ── Get election details ──────────────────────────────────────
async function getElectionDetails(electionId) {
    if (!votingContract) return null;
    try {
        const d = await votingContract.methods.getElection(electionId).call();
        return {
            name: d[0],
            startTime: parseInt(d[1]),
            endTime: parseInt(d[2]),
            isActive: d[3],
            totalVotes: parseInt(d[4] || 0)
        };
    } catch (error) {
        console.error('getElectionDetails error:', error.message);
        return null;
    }
}

// ── Health check ──────────────────────────────────────────────
async function checkBlockchainConnection() {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        const networkId = await web3.eth.net.getId();
        return {
            connected: true,
            blockNumber: Number(blockNumber),
            networkId: Number(networkId),
            contractLoaded: !!votingContract,
            contractAddress: contractAddress || null
        };
    } catch (error) {
        return { connected: false, error: error.message, contractLoaded: false };
    }
}

module.exports = {
    web3,
    votingContract,
    contractAddress,
    castVoteOnBlockchain,
    getBlockchainVoteCount,
    verifyVoteOnChain,
    getElectionDetails,
    generateVerificationCode,
    checkBlockchainConnection
};