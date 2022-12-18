const mongoose = require("mongoose")

const Category = new mongoose.Schema({
    name: {
        tye: String,
        required,
        unique
    },
    subCategory: [String]
})