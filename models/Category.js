const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required,
        unique
    },
    slug: {
        type: String,
        required,
        unique
    },
    parentId: {String}
})


module.exports = mongoose.model('Category', categorySchema);