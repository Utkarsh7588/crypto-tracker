const { producer } = require('../config/kafka');

const emailProducer = async (email, otp) => {
    await producer.send({
        topic: 'email-verification',
        messages: [
            {
                value: JSON.stringify({
                    type: 'VERIFICATION_EMAIL',
                    data: {
                        email: email,
                        otp: otp
                    }
                })
            }
        ]
    });
}
module.exports = {
    emailProducer
}