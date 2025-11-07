const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'email-consumer-group' });

module.exports = {
  kafka,
  producer,
  consumer
};