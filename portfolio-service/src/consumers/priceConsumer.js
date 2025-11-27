const { consumer, producer } = require('../config/kafka');
const Portfolio = require('../models/Portfolio');

const startPriceConsumer = async () => {
    try {
        await consumer.subscribe({ topic: 'price_updates', fromBeginning: false });

        console.log('✅ Portfolio service subscribed to price_updates');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const prices = JSON.parse(message.value.toString());
                    // Create a map for faster lookup
                    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));

                    // Iterate all portfolios (MVP approach)
                    const portfolios = await Portfolio.find({});

                    for (const portfolio of portfolios) {
                        let totalValue = 0;
                        for (const coin of portfolio.coins) {
                            const currentPrice = priceMap.get(coin.symbol);
                            if (currentPrice) {
                                totalValue += coin.quantity * parseFloat(currentPrice);
                            }
                        }

                        // Publish portfolio update
                        await producer.send({
                            topic: 'portfolio_updates',
                            messages: [{
                                value: JSON.stringify({
                                    userId: portfolio.userId,
                                    totalValue: totalValue.toFixed(2),
                                    alertsEnabled: portfolio.alertsEnabled,
                                    timestamp: new Date().toISOString()
                                })
                            }]
                        });
                    }
                } catch (error) {
                    console.error('❌ Error processing price update:', error);
                }
            },
        });
    } catch (error) {
        console.error('❌ Kafka connection error:', error);
    }
};

module.exports = { startPriceConsumer };
