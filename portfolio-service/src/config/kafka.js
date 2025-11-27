const { Kafka } = require('kafkajs');
const os = require('os');

const kafka = new Kafka({
    clientId: `portfolio-service-${os.hostname()}`,
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'portfolio-group' });
const producer = kafka.producer();

const connectKafka = async () => {
    try {
        await consumer.connect();
        await producer.connect();
        console.log('✅ Kafka connected');
    } catch (error) {
        console.error('❌ Kafka connection error:', error);
    }
};

module.exports = { kafka, consumer, producer, connectKafka };
