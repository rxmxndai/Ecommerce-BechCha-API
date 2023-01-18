const mongoose = require("mongoose")
const { default: slugify } = require("slugify")

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
    image: {
        type: Buffer
    }
} , 
    { timestamps: true }
)


categorySchema.pre("save", async function (next) {
    const category = this
    if (category.isModified("name")) {
        console.log('changed');
        category.slug = slugify(category.name)
    }
    next()
})

const Category = mongoose.model('Category', categorySchema);
module.exports = Category