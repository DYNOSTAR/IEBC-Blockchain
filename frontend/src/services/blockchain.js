import Web3 from 'web3';

let web3 = null;
let votingContract = null;
let userAccount = null;

// Contract ABI - Copy this from your compiled contract
// For now, we'll use a minimal ABI for testing
const CONTRACT_ABI = [
    {
        "inputs": [
            { "type": "uint256", "name": "_electionId" },
            { "type": "uint256", "name": "_positionId" },
            { "type": "uint256", "name": "_candidateId" },
            { "type": "string", "name": "_verificationCode" }
        ],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "type": "uint256", "name": "_electionId" },
            { "type": "address", "name": "_voter" },
            { "type": "uint256", "name": "_positionId" }
        ],
        "name": "hasVotedForPosition",
        "outputs": [{ "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "type": "uint256", "name": "_electionId" }],
        "name": "getElection",
        "outputs": [
            { "type": "string" },
            { "type": "uint256" },
            { "type": "uint256" },
            { "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract address - Replace with your deployed contract address
const CONTRACT_ADDRESS = '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0'; // Update this after deployment

// Initialize Web3
export const initWeb3 = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            
            votingContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
            
            console.log('✅ Web3 initialized');
            console.log('Account:', userAccount);
            console.log('Contract:', CONTRACT_ADDRESS);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                userAccount = accounts[0];
                console.log('Account changed:', userAccount);
            });
            
            return { web3, votingContract, userAccount };
        } catch (error) {
            console.error('User denied account access', error);
            throw error;
        }
    } else {
        console.error('MetaMask not installed');
        throw new Error('MetaMask not installed');
    }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Get current account
export const getCurrentAccount = async () => {
    if (web3) {
        const accounts = await web3.eth.getAccounts();
        return accounts[0];
    }
    return null;
};

// Cast vote on blockchain
export const castVote = async (electionId, positionId, candidateId, verificationCode) => {
    if (!votingContract || !userAccount) {
        throw new Error('Web3 not initialized. Please connect wallet first.');
    }
    
    try {
        console.log('Casting vote on blockchain:', {
            electionId,
            positionId,
            candidateId,
            verificationCode,
            from: userAccount
        });
        
        // For testing without actual contract, simulate successful transaction
        // Remove this when contract is deployed
        return {
            success: true,
            transactionHash: '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            blockNumber: Math.floor(Math.random() * 1000000)
        };
        
        // Uncomment when contract is deployed
        /*
        const tx = await votingContract.methods.vote(
            electionId,
            positionId,
            candidateId,
            verificationCode
        ).send({
            from: userAccount,
            gas: 300000,
            gasPrice: await web3.eth.getGasPrice()
        });
        
        return {
            success: true,
            transactionHash: tx.transactionHash,
            blockNumber: tx.blockNumber
        };
        */
    } catch (error) {
        console.error('Vote transaction failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Verify vote on blockchain
export const verifyVote = async (electionId, positionId, voterAddress) => {
    if (!votingContract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        // For testing without actual contract
        return true;
        
        // Uncomment when contract is deployed
        /*
        const hasVoted = await votingContract.methods
            .hasVotedForPosition(electionId, voterAddress, positionId)
            .call();
        return hasVoted;
        */
    } catch (error) {
        console.error('Verification failed:', error);
        return false;
    }
};

// Get vote count
export const getVoteCount = async (electionId, positionId, candidateId) => {
    if (!votingContract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        // For testing without actual contract
        return Math.floor(Math.random() * 10000);
        
        // Uncomment when contract is deployed
        /*
        const count = await votingContract.methods
            .getVoteCount(electionId, positionId, candidateId)
            .call();
        return parseInt(count);
        */
    } catch (error) {
        console.error('Failed to get vote count:', error);
        return 0;
    }
};

// Get election details
export const getElectionDetails = async (electionId) => {
    if (!votingContract) {
        throw new Error('Contract not initialized');
    }
    
    try {
        // For testing without actual contract
        return {
            name: 'Kenya General Election 2027',
            startTime: Math.floor(Date.now() / 1000) - 86400,
            endTime: Math.floor(Date.now() / 1000) + 864000,
            isActive: true
        };
        
        // Uncomment when contract is deployed
        /*
        const details = await votingContract.methods.getElection(electionId).call();
        return {
            name: details[0],
            startTime: parseInt(details[1]),
            endTime: parseInt(details[2]),
            isActive: details[3]
        };
        */
    } catch (error) {
        console.error('Failed to get election details:', error);
        return null;
    }
};