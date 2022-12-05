const mongoose = require("mongoose")

const productSchema = new mongoose.Schema( {
        title: {
            type: String, 
            required: true,
        },
        description: {
            type: String, 
            required: true,
        },
        img: {
            type: String, 
            required: true,
        }, 
        category: {
            type: String, 
            required: true,
        }, 
        subCategory: {
            type: Array, 
            required: true,
        }, 
        specification: {
            type: String, 
            required: true,
        }, 
        price: {
            type: Number, 
            required: true,
        }, 

    }, 

    { timestamps : true }
);

module.exports = mongoose.model('Product', productSchema);