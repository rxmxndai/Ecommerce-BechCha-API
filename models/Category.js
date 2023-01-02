const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    parentId: {
        type: String
    },
    img: {
        type: buffer
    } 
} , 
    { timestamps: true }
)

userSchema.virtual('User', {
    ref: "User",
    localField: "_id",
    foreignField: "category"
})


module.exports = mongoose.model('Category', categorySchema);