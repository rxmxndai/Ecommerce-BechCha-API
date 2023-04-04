const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      default: 1,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalItems: { type: Number, required: true },
  payable: { type: Number, required: true },
  status: { type: String, default: "pending" },
  shipping: {type: String, required: true},
  billing: {type: String, required: true},
  deliveredAt: {
    type: Date
  },
},
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);