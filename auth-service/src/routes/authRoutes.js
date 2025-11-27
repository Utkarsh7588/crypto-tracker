const express = require('express');
const router = express.Router();
const { register, login, verifyEmailOtp, getUserById } = require('../controller/authController');

// Signup API
router.post('/signup', async (req, res) => register(req, res));

// Login API
router.post('/login', async (req, res) => login(req, res));

router.post('/verify/email', async (req, res) => verifyEmailOtp(req, res));

// Get User by ID (Internal use)
router.get('/users/:id', async (req, res) => getUserById(req, res));

module.exports = router;