const { consumer } = require('../config/kafka');
const { sendVerificationEmail } = require('../utils/emailutils');

const startEmailConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'email-verification', fromBeginning: false });
    
    console.log('📧 Email consumer started and subscribed to email-verification topic');

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = JSON.parse(message.value.toString());
          console.log(`📥 Received email request: ${messageValue.type}`);
          
          if (messageValue.type === 'VERIFICATION_EMAIL') {
            const { email, otp } = messageValue.data;
            
            console.log(`Sending verification email to: ${email}`);
            await sendVerificationEmail(email, otp);
            
            console.log(`✅ Verification email sent to: ${email}`);
          }
        } catch (error) {
          console.error('❌ Error processing email message:', error);
          // Don't throw error - continue processing other messages
        }
      },
    });
  } catch (error) {
    console.error('❌ Email consumer error:', error);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down email consumer gracefully');
  await consumer.disconnect();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down email consumer gracefully');
  await consumer.disconnect();
});

module.exports = { startEmailConsumer };