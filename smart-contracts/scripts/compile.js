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
const abiPath = path.resolve(__dirname, '../abi/Voting.json');
fs.writeFileSync(abiPath, JSON.stringify(contract.abi, null, 2));
console.log('✅ ABI saved to:', abiPath);

// Save bytecode
const bytecodePath = path.resolve(__dirname, '../abi/bytecode.bin');
fs.writeFileSync(bytecodePath, contract.evm.bytecode.object);
console.log('✅ Bytecode saved');

console.log('✅ Contract compiled successfully!');