const express = require('express');
const User = require('../models/User');
const router = express.Router();
const generateToken = require('../utils/jwtutils');
const { register, login } = require('../controller/authController');

// Signup API
router.post('/signup', async (req, res) => register(req, res));

// Login API
router.post('/login', async (req, res) => login(req, res));

module.exports = router;