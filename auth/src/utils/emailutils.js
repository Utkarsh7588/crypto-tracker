const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD 
  }
});

const sendVerificationEmail = async (email, otp) => {
  try {
    const time = Number(process.env.JWT_EXPIRY_EMAIL || 10); // Default 10 minutes
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Crypto Portfolio Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with Crypto Portfolio Tracker!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in ${time} minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Crypto Portfolio Tracker Team
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email transporter is ready');
  } catch (error) {
    console.error('❌ Email transporter configuration error:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  verifyTransporter
};