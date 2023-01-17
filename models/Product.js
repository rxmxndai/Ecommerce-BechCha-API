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
        images: [Buffer], 
        category: {
            type: mongoose.Schema.Types.ObjectId, 
            required: true,
            ref: "Category"
        }, 
        specification: {
            type: Map,
            of: [{
                type: String,
            }],
            keys: String
        }, 
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number, 
            required: true,
        }, 
        reviews: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Review" }
        ],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }, 

    { timestamps : true }
);



productSchema.methods.toJSON = function () {
    const product = this
    const productObject = product.toObject()


    return productObject
}


module.exports = mongoose.model('Product', productSchema);