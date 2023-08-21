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
  email: {
    type: String,
  },
  recipient: { type: String, required: true },
  totalItems: { type: Number, required: true },
  payable: { type: Number, required: true },
  shipping: {type: String, required: true},
  billing: {type: String, required: true},
  deliveredAt: {
    type: Date
  },
  status: { type: String, default: "pending" },
  isPaid : { type: Boolean, default: false },
  paymentType : { type: String}
},
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);