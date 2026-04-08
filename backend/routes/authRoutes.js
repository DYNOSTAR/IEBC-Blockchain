const express = require('express');
const router = express.Router();
const {
    voterLogin,
    adminLogin,
    verifyVoter,
    getCurrentUser,
    logout
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/voter/login', voterLogin);
router.post('/admin/login', adminLogin);
router.post('/verify-voter', verifyVoter);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes are working!' });
});

module.exports = router;