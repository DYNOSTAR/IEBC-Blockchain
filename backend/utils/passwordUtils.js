const bcrypt = require('bcryptjs');

// Hash a password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

// Verify password
async function verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

// Generate a random verification code
function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 15).toUpperCase();
}

module.exports = { hashPassword, verifyPassword, generateVerificationCode };