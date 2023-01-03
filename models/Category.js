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
        type: Buffer
    },
    children: [categorySchema]

} , 
    { timestamps: true }
)



categorySchema.virtual('User', {
    ref: "User",
    localField: "_id",
    foreignField: "category"
})



module.exports = mongoose.model('Category', categorySchema);