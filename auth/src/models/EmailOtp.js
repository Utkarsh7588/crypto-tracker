const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  otp: {
    type: Number,
    required: [true, 'OTP is required'],
    min: [100000, 'OTP must be 6 digits'],
    max: [999999, 'OTP must be 6 digits']
  },
  token:{
    type:String,
    required:true,
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

emailOtpSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

emailOtpSchema.methods.compareOtp = function (otp) {
  return otp == this.otp;
}

module.exports = mongoose.model('EmailOtp', emailOtpSchema);