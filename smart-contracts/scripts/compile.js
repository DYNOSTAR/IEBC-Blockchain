const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.resolve(__dirname, '../contracts/Voting.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
    language: 'Solidity',
    sources: {
        'Voting.sol': {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*'],
            },
        },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const contract = output.contracts['Voting.sol']['Voting'];

// Save ABI
fs.writeFileSync(
    path.resolve(__dirname, '../abi/Voting.json'),
    JSON.stringify(contract.abi, null, 2)
);

// Save bytecode
fs.writeFileSync(
    path.resolve(__dirname, '../bytecode/Voting.bin'),
    contract.evm.bytecode.object
);

console.log('✅ Contract compiled successfully!');
console.log('ABI saved to: smart-contracts/abi/Voting.json');
console.log('Bytecode saved to: smart-contracts/bytecode/Voting.bin');