const { Kafka } = require('kafkajs');
const os = require('os');

const kafka = new Kafka({
    clientId: `websocket-service-${os.hostname()}`,
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'websocket-group' });

const connectKafka = async () => {
    try {
        await consumer.connect();
        console.log('✅ Kafka connected');
    } catch (error) {
        console.error('❌ Kafka connection error:', error);
    }
};

module.exports = { kafka, consumer, connectKafka };
