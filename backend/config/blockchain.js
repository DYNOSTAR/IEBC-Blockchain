const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545');

let contractAddress = null;
let contractABI = null;
let votingContract = null;

// Load contract if exists
try {
    const contractPath = path.resolve(__dirname, '../../smart-contracts/abi/contract.json');
    if (fs.existsSync(contractPath)) {
        const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        contractAddress = contractData.address;
        contractABI = contractData.abi;
        votingContract = new web3.eth.Contract(contractABI, contractAddress);
        console.log('📦 Contract loaded from:', contractPath);
        console.log('📍 Contract address:', contractAddress);
    } else {
        console.log('⚠️ Contract not found. Please deploy the contract first.');
    }
} catch (error) {
    console.log('⚠️ Error loading contract:', error.message);
}

// Check blockchain connection
async function checkBlockchainConnection() {
    try {
        const isListening = await web3.eth.net.isListening();
        const blockNumber = await web3.eth.getBlockNumber();
        return {
            connected: isListening,
            blockNumber: blockNumber,
            networkId: await web3.eth.net.getId(),
            contractAddress: contractAddress || 'Not deployed'
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            contractAddress: contractAddress || 'Not deployed'
        };
    }
}

// Get contract instance
function getContract() {
    return votingContract;
}

// Get web3 instance
function getWeb3() {
    return web3;
}

module.exports = {
    web3,
    votingContract,
    contractAddress,
    getContract,
    getWeb3,
    checkBlockchainConnection
};