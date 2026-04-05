const bcrypt = require('bcryptjs');

// Hash password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Generate hash for password
async function generateHashForPassword(password) {
    try {
        const hashedPassword = await hashPassword(password);
        console.log(`Password: ${password}`);
        console.log(`Hash: ${hashedPassword}`);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

// Export for use
module.exports = {
    hashPassword,
    generateHashForPassword
};
