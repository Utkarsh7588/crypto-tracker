const axios = require('axios');
const { producer } = require('./config/kafka');

let priceCache = {}; // In-memory cache for APIs

const fetchPrices = async () => {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/price');
        const prices = response.data;

        // Update cache
        prices.forEach(p => {
            priceCache[p.symbol] = p.price;
        });

        // Publish to Kafka
        // We publish the entire array as one message to reduce overhead, or chunks.
        // For simplicity and to allow consumers to process easily, let's publish the whole batch.
        // But Kafka has message size limits. 2000 items * ~50 bytes = 100KB. Safe.

        await producer.send({
            topic: 'price_updates',
            messages: [
                { value: JSON.stringify(prices) }
            ]
        });

        console.log(`✅ Fetched and published ${prices.length} prices`);
    } catch (error) {
        console.error('❌ Error fetching prices:', error.message);
    }
};

const startFetcher = (intervalMs = 10000) => {
    fetchPrices(); // Initial fetch
    setInterval(fetchPrices, intervalMs);
};

const getPrice = (symbol) => priceCache[symbol];

const searchCoins = (query) => {
    if (!query) return [];
    const upperQuery = query.toUpperCase();
    return Object.keys(priceCache)
        .filter(symbol => symbol.includes(upperQuery))
        .map(symbol => ({
            symbol,
            price: priceCache[symbol]
        }));
};

module.exports = { startFetcher, getPrice, searchCoins };
