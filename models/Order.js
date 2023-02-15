const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema( {
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
    ],
    quantity: {type: Number, required: true},
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: true},
    status: { type: String, default: "pending" },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
      },
      paidAt: {
        type: Date
      },
      isDelivered: {
        type: Boolean,
        required: true,
        default: false
      },
      deliveredAt: {
        type: Date
      },
    },
    { timestamps : true }
);

module.exports = mongoose.model('Order', orderSchema);