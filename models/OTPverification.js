const mongoose = require("mongoose")

const OTPverification = new mongoose.Schema({
        email: {
            type: String,
            required: true
        },
        otp: {
            type: String,
            required: true,
        },
        createdAt: Date,
        expiresAt: Date,
    }
)

const OTPmodel = mongoose.model("OTPmodel", OTPverification);

module.exports = OTPmodel