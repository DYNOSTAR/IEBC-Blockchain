const Web3 = require('web3');
require('dotenv').config();

// Connect to Ethereum test network (Ganache or Sepolia)
const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:7545');

// Contract address after deployment
const contractAddress = process.env.CONTRACT_ADDRESS;

// Contract ABI will be added after compiling the smart contract
const contractABI = []; // Add ABI here after compilation

const votingContract = new web3.eth.Contract(contractABI, contractAddress);

module.exports = { web3, votingContract, contractAddress };