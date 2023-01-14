const mongoose = require("mongoose")


const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    review: {
        type: String,
        max: 300,
        required: true,
    },
    rating: {
        type: Number,
    },
})

const Review = mongoose.model("Review", reviewSchema)


module.exports = Review