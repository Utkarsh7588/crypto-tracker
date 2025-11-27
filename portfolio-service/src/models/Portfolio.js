const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    alertsEnabled: { type: Boolean, default: false },
    alertThreshold: { type: Number, default: 0 },
    lastEmailSent: { type: Date, default: null },
    coins: [{
        symbol: { type: String, required: true },
        quantity: { type: Number, required: true },
        buyPrice: { type: Number, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
