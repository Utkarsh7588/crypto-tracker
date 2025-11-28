const { consumer } = require('../config/kafka');

const startUpdatesConsumer = async (io) => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'price_updates', fromBeginning: false });
        await consumer.subscribe({ topic: 'portfolio_updates', fromBeginning: false });

        console.log('✅ WebSocket service subscribed to updates');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());

                    if (topic === 'price_updates') {
                        // Broadcast to all clients
                        io.emit('price_update', data);
                    } else if (topic === 'portfolio_updates') {
                        // Emit to specific user room
                        const { userId } = data;
                        if (userId) {
                            io.to(userId).emit('portfolio_update', data);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error processing update:', error);
                }
            },
        });
    } catch (error) {
        console.error('❌ Kafka connection error:', error);
    }
};

module.exports = { startUpdatesConsumer };
