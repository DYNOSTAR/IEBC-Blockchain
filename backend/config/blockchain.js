const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load contract artifacts
let contractAddress = null;
let contractABI = null;

try {
    const contractData = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../smart-contracts/contract-address.json'), 'utf8')
    );
    contractAddress = contractData.address;
    contractABI = contractData.abi;
    console.log('📦 Contract loaded:', contractAddress);
} catch (error) {
    console.warn('⚠️ Contract not found. Please deploy the contract first.');
}

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545');

let votingContract = null;
if (contractAddress && contractABI) {
    votingContract = new web3.eth.Contract(contractABI, contractAddress);
}

// Generate verification code
function generateVerificationCode() {
    return 'V' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Cast vote on blockchain
async function castVoteOnBlockchain(electionId, positionId, candidateId, voterAddress, privateKey) {
    try {
        const verificationCode = generateVerificationCode();
        
        // Call smart contract vote function
        const tx = await votingContract.methods.vote(
            electionId,
            positionId,
            candidateId,
            verificationCode
        ).send({
            from: voterAddress,
            gas: 300000,
            gasPrice: await web3.eth.getGasPrice()
        });
        
        return {
            success: true,
            transactionHash: tx.transactionHash,
            verificationCode: verificationCode,
            blockNumber: tx.blockNumber
        };
    } catch (error) {
        console.error('Blockchain vote error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Get vote count from blockchain
async function getBlockchainVoteCount(electionId, positionId, candidateId) {
    try {
        const count = await votingContract.methods.getVoteCount(electionId, positionId, candidateId).call();
        return parseInt(count);
    } catch (error) {
        console.error('Error getting vote count:', error);
        return 0;
    }
}

// Verify vote on blockchain
async function verifyVote(electionId, positionId, voterAddress) {
    try {
        const hasVoted = await votingContract.methods.hasVotedForPosition(electionId, voterAddress, positionId).call();
        return hasVoted;
    } catch (error) {
        console.error('Error verifying vote:', error);
        return false;
    }
}

// Get election details
async function getElectionDetails(electionId) {
    try {
        const details = await votingContract.methods.getElection(electionId).call();
        return {
            name: details[0],
            startTime: parseInt(details[1]),
            endTime: parseInt(details[2]),
            isActive: details[3]
        };
    } catch (error) {
        console.error('Error getting election details:', error);
        return null;
    }
}

module.exports = {
    web3,
    votingContract,
    contractAddress,
    castVoteOnBlockchain,
    getBlockchainVoteCount,
    verifyVote,
    getElectionDetails,
    generateVerificationCode
};