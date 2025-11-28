const express = require('express');
const router = express.Router();
const { getPrice, searchCoins } = require('../fetcher');

// Search coins
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }
    const results = searchCoins(q);
    res.json(results);
});

// Get live price
router.get('/:symbol', (req, res) => {
    const { symbol } = req.params;
    const price = getPrice(symbol.toUpperCase());

    if (!price) {
        return res.status(404).json({ message: 'Coin not found' });
    }

    res.json({ symbol: symbol.toUpperCase(), price });
});

module.exports = router;
