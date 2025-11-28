const axios = require('axios');
const { consumer } = require('../config/kafka');
const { sendEmail } = require('../utils/email');

const startPortfolioConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'portfolio_updates', fromBeginning: false });

        console.log('✅ Notification service subscribed to portfolio_updates');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log("Portfolio update received");
                try {
                    const update = JSON.parse(message.value.toString());
                    const { userId, totalValue, alertsEnabled, alertThreshold, lastEmailSent, timestamp } = update;

                    if (alertsEnabled && parseFloat(totalValue) < (alertThreshold || 0)) {
                        const now = Date.now();
                        const lastSentTime = lastEmailSent ? new Date(lastEmailSent).getTime() : 0;

                        // Rate limit: 24 hours (86400000 ms)
                        if (now - lastSentTime > 86400000) {
                            console.log(`🔔 Alert triggered for user ${userId}. Value: $${totalValue} < $${alertThreshold}`);

                            try {
                                // Fetch user email from Auth Service
                                // Assuming auth-service is reachable at http://auth-service:3001 inside Docker network
                                // Or use localhost if running locally without docker networking for dev
                                const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
                                const userRes = await axios.get(`${authServiceUrl}/users/${userId}`);
                                const userEmail = userRes.data.email;

                                if (userEmail) {
                                    await sendEmail(
                                        userEmail,
                                        'Portfolio Value Alert',
                                        `Your portfolio value has dropped to $${totalValue}, which is below your threshold of $${alertThreshold}.\n\nTimestamp: ${timestamp}`
                                    );

                                    // Update lastEmailSent in Portfolio Service
                                    const portfolioServiceUrl = process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:3003';
                                    await axios.put(`${portfolioServiceUrl}/portfolio/internal/email-sent`, { userId });

                                    console.log(`✅ Alert email sent to ${userEmail}`);
                                }
                            } catch (err) {
                                console.error('❌ Failed to fetch user email or send alert:', err.message);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error processing portfolio update:', error);
                }
            },
        });
    } catch (error) {
        console.error('❌ Kafka connection error:', error);
    }
};

module.exports = { startPortfolioConsumer };
