const { Kafka } = require('kafkajs');
const os = require('os');

const kafka = new Kafka({
    clientId: `price-service-${os.hostname()}`,
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const producer = kafka.producer();

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('✅ Kafka producer connected');
    } catch (error) {
        console.error('❌ Kafka producer connection error:', error);
    }
};

module.exports = { producer, connectProducer };
