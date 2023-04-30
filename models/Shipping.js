const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  billingAddress: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  contacts: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        const regex = /^9\d{9}$/;
        return regex.test(value);
      },
      message: "Enter a valid phone number!",
    },
  },
});

module.exports = mongoose.model("Shipping", shippingSchema);
