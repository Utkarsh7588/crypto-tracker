const express = require('express');
const router = express.Router();
const Portfolio = require('../models/Portfolio');

// Get Portfolio
router.get('/', async (req, res) => {
    // In a real app, userId would come from auth middleware
    const userId = req.headers['x-user-id'] || 'default-user';

    try {
        let portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            portfolio = await Portfolio.create({ userId, coins: [] });
        }
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add Coin
router.post('/add', async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default-user';
    const { symbol, quantity, buyPrice } = req.body;

    try {
        let portfolio = await Portfolio.findOne({ userId });
        if (!portfolio) {
            portfolio = new Portfolio({ userId, coins: [] });
        }

        // Check if coin exists, update quantity if so
        const existingCoinIndex = portfolio.coins.findIndex(c => c.symbol === symbol);
        if (existingCoinIndex > -1) {
            portfolio.coins[existingCoinIndex].quantity += Number(quantity);
            // Average buy price logic could go here
        } else {
            portfolio.coins.push({ symbol, quantity, buyPrice });
        }

        await portfolio.save();
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Settings
router.put('/settings', async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default-user';
    const { alertsEnabled } = req.body;

    try {
        const portfolio = await Portfolio.findOneAndUpdate(
            { userId },
            { alertsEnabled },
            { new: true, upsert: true }
        );
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
