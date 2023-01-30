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
        type: mongoose.Types.ObjectId
    },
    display: Buffer
} , 
    { timestamps: true }
)

categorySchema.methods.toJSON = function () {
    const category = this
    const catObject = category.toObject();
    catObject.display = Array.from(new Uint8Array(category.display), byte => String.fromCharCode(byte)).join("");
    return catObject;
}

categorySchema.pre("save", async function (next) {
    const category = this
    if (category.isModified("name")) {
        category.slug = slugify(category.name)
    }
    next()
})

const Category = mongoose.model('Category', categorySchema);
module.exports = Category