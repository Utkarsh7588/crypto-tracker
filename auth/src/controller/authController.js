const { now } = require('mongoose');
const EmailOtp = require('../models/EmailOtp');
const User = require('../models/User');
const { generateToken, verifyEmailToken, generateEmailToken } = require('../utils/jwtutils');
const { emailProducer } = require('../producers/emailProducer');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists with this email'
      });
    }

    // Generate single token
    const { token, expiresAt } = generateEmailToken({
      name,
      email,
      password
    });

    const emailOtp = new EmailOtp({
      token,
      email,
      otp: Math.floor(100000 + Math.random() * 900000),
      expiresAt,
    });

    await emailOtp.save();

    await emailProducer(email, emailOtp.otp);

    res.status(201).json({
      message: 'Verify email to complete user registration',
      email_verification_id: emailOtp._id,
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Generate single token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

const verifyEmailOtp = async (req, res) => {
  const { _id, otp } = req.body;
  try {
    const emailOtp = await EmailOtp.findById(_id);

    if (!emailOtp) {
      return res.status(401).json({
        message: 'Expired otp'
      });
    }

    const isExpired = await emailOtp.isExpired();
    if (isExpired) {
      return res.status(401).json({
        message: 'Expired otp'
      });
    }

    const isValid = await emailOtp.compareOtp(otp);
    if (!isValid) {
      return res.status(401).json({
        message: 'Incorrect otp'
      });
    }

    const { email, name, password } = verifyEmailToken(emailOtp.token);

    const user = new User({
      email,
      name,
      password,
      isVerified: true
    });

    await user.save();

    await emailOtp.deleteOne();

    res.status(201).json({
      message: 'Registration successful please login'
    })


  } catch (error) {
    console.error('Email Verification error:', error);
    res.status(500).json({
      message: 'Error verifying email',
      error: error.message
    });
  }
  finally {
    await EmailOtp.deleteMany({ expiresAt: { $lt: Date.now() } });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  verifyEmailOtp
};