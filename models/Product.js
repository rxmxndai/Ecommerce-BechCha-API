const mongoose = require("mongoose")

const productSchema = new mongoose.Schema( {
        title: {
            type: String,
            unique: true, 
            required: true,
        },
        description: {
            type: String, 
            required: true,
        },
        images: [{
            img: {
                type: String, 
                required: true,
            }
        }], 
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
        price: {
            type: Number, 
            required: true,
        }, 
        reviews: [
            {
                userId: mongoose.Schema.Types.ObjectId, ref: 'User',
                review: String,
            }
        ]
    }, 

    { timestamps : true }
);

module.exports = mongoose.model('Product', productSchema);