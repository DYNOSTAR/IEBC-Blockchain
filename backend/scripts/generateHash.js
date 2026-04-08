const bcrypt = require('bcryptjs');

async function generateHash() {
    // For voter password
    const voterPassword = 'Voter@2027!';
    const voterHash = await bcrypt.hash(voterPassword, 10);
    console.log('Voter Password:', voterPassword);
    console.log('Voter Hash:', voterHash);
    
    // For admin password
    const adminPassword = 'Admin@2027!';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    console.log('\nAdmin Password:', adminPassword);
    console.log('Admin Hash:', adminHash);
}

generateHash();