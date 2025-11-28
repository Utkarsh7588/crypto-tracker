const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: '"Crypto Tracker" <no-reply@cryptotracker.com>',
            to,
            subject,
            text
        });
        console.log(`📧 Email sent: ${info.messageId}`);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
};

module.exports = { sendEmail };
