const mongoose = require("mongoose")

const productSchema = new mongoose.Schema( {
        title: {
            type: String,
            unique: true, 
            required: true,
        },
        brand: {
            type: String
        },
        description: {
            type: String, 
            required: true,
            trim: true
        },
        images: [
            {
              public_id: { type: String, required: true },
              url: { type: String, required: true },
            },
        ],
        category: {
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            ref: "Category"
        }, 
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number, 
            required: true,
        }, 
        sold: {
            type: Number,
            default: 0
        },
        reviews: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Review" }
        ],
        averageRating: {
            type: Number,
            validate:  {
                validator: function(value) {
                    return value >= 1 && value <= 5;
                },
                message: "Rating should be between 1 and 5"
            },
        },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isFeatured: { type: Boolean, default: false },
        featuredMessage: { type: String },
        featuredTitle: { type: String }
    }, 

    { timestamps : true }
);



productSchema.methods.toJSON = function () {
    const product = this
    const productObject = product.toObject()


    return productObject
}


module.exports = mongoose.model('Product', productSchema);