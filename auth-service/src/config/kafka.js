const { Kafka } = require('kafkajs');
const os = require('os');

const kafka = new Kafka({
  clientId: `auth-service-${os.hostname()}`,
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'email-consumer-group' });

module.exports = {
  kafka,
  producer,
  consumer
};