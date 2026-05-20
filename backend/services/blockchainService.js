const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let contractAddress = null;
let contractABI = null;

const possiblePaths = [
    path.resolve(__dirname, '../../smart-contracts/abi/contract.json'),
    path.resolve(__dirname, '../blockchain/contract.json'),
];

for (const p of possiblePaths) {
    try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        contractAddress = data.address;
        contractABI = data.abi;
        console.log('📦 Contract loaded from:', p);
        console.log('📍 Contract address:', contractAddress);
        break;
    } catch { }
}

if (!contractAddress) {
    console.warn('⚠️  Contract not found. Run: cd smart-contracts && node scripts/compile.js && node scripts/deploy.js');
}

const GANACHE_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545';
const web3 = new Web3(GANACHE_URL);
const SERVER_ADDRESS = process.env.SERVER_ETH_ADDRESS;
const SERVER_PRIVATE_KEY = process.env.SERVER_ETH_PRIVATE_KEY;

let votingContract = null;
if (contractAddress && contractABI) {
    votingContract = new web3.eth.Contract(contractABI, contractAddress);
}

function generateVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'V-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// sha256(nationalId) → 32-byte Buffer → Solidity bytes32
// Web3 v4.x requires Uint8Array (Buffer) for bytes32, not a hex string.
// PII never touches the chain — only the hash.
function hashVoterId(nationalId) {
    return crypto.createHash('sha256').update(String(nationalId)).digest();
}

// positionId   = blockchain position ID (display_order, 1–6)
// candidateId  = DB candidate ID (matches blockchain candidate ID after setupElection)
// nationalId   = voter's national ID — hashed before sending to chain
async function castVoteOnBlockchain(positionId, candidateId, nationalId) {
    const verificationCode = generateVerificationCode();
    const voterIdHash = hashVoterId(nationalId);

    if (!votingContract || !SERVER_ADDRESS || !SERVER_PRIVATE_KEY) {
        console.warn('⚠️  Blockchain not fully configured — simulating transaction');
        return {
            success: true, simulated: true,
            transactionHash: '0x' + crypto.randomBytes(32).toString('hex'),
            verificationCode,
            blockNumber: Math.floor(Math.random() * 1000000) + 18000000
        };
    }

    try {
        const txData = votingContract.methods
            .vote(parseInt(positionId), parseInt(candidateId), voterIdHash)
            .encodeABI();

        const gasEstimate = await web3.eth.estimateGas({
            from: SERVER_ADDRESS, to: contractAddress, data: txData
        });
        const gasPrice = await web3.eth.getGasPrice();

        const signedTx = await web3.eth.accounts.signTransaction({
            from: SERVER_ADDRESS,
            to: contractAddress,
            data: txData,
            gas: Math.ceil(Number(gasEstimate) * 1.3),
            gasPrice
        }, SERVER_PRIVATE_KEY);

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('✅ Vote on blockchain TX:', receipt.transactionHash);

        return {
            success: true, simulated: false,
            transactionHash: receipt.transactionHash,
            verificationCode,
            blockNumber: Number(receipt.blockNumber)
        };
    } catch (error) {
        console.error('Blockchain castVote error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getBlockchainVoteCount(candidateId) {
    if (!votingContract) return null;
    try {
        const c = await votingContract.methods.getCandidate(parseInt(candidateId)).call();
        return parseInt(c.voteCount || 0);
    } catch { return null; }
}

async function getElectionDetails() {
    if (!votingContract) return null;
    try {
        const active = await votingContract.methods.electionActive().call();
        const nextPos = await votingContract.methods.nextPositionId().call();
        const nextCand = await votingContract.methods.nextCandidateId().call();
        return {
            isActive: active,
            positions: parseInt(nextPos) - 1,
            candidates: parseInt(nextCand) - 1,
            address: contractAddress
        };
    } catch (error) {
        console.error('getElectionDetails error:', error.message);
        return null;
    }
}

async function checkBlockchainConnection() {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        const networkId = await web3.eth.net.getId();
        let electionActive = false, candidateCount = 0;
        if (votingContract) {
            try {
                electionActive = await votingContract.methods.electionActive().call();
                const nextCand = await votingContract.methods.nextCandidateId().call();
                candidateCount = parseInt(nextCand) - 1;
            } catch { }
        }
        return {
            connected: true,
            blockNumber: Number(blockNumber),
            networkId: Number(networkId),
            contractLoaded: !!votingContract,
            contractAddress,
            electionActive,
            candidateCount
        };
    } catch (error) {
        return { connected: false, error: error.message, contractLoaded: false };
    }
}

module.exports = {
    web3, votingContract, contractAddress,
    castVoteOnBlockchain, getBlockchainVoteCount, hashVoterId,
    getElectionDetails, generateVerificationCode, checkBlockchainConnection
};
