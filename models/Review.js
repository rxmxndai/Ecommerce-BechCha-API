const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        rating: {
            type: Number,
            validate:  {
                validator: function(value) {
                    return value >= 1 && value <= 5;
                },
                message: "Rating should be between 1 and 5"
            },
            required: true
        },      
        comment: {
            type: String,
            required: true
        }
}, { timestamps: true } 
)



const Review = mongoose.model("Review", reviewSchema)
module.exports =  Review