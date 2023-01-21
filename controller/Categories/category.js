const Category = require("../../models/Category")
const tryCatch = require("../../utils/tryCatch");
const slugify = require("slugify");
const customError = require("../../utils/customError");
const { default: mongoose } = require("mongoose");
const sharp = require("sharp");


const createCategories = (categories, parentId = null) => {
    let CategoriesList = [];
    let categoryList;

    if (parentId == null) {
        categoryList = categories.filter((cat) => cat.parentId == undefined)
    }
    else {
        categoryList = categories.filter((cat) => cat.parentId == parentId)
    }

    for (let each of categoryList) {
        CategoriesList.push({
            _id: each._id,
            name: each.name,
            slug: each.slug,
            display: each.display,
            // recursive calls for children with same data as parent Cat
            children: createCategories(categories, each._id)
        })
    }

    return CategoriesList;
}




const addCategory = tryCatch(async (req, res) => {

    const payload = {
        name: req.body.name,
        slug: slugify(req.body.name),
        display: req.file.buffer
    }


    if (req.body.parentId) {
        // if (!mongoose.isValidObjectId(req.body.parentId)) throw new customError("Not a valid parentID!", 400);
        await Category.findById(req.body.parentId)
        payload.parentId = req.body.parentId;
    }

    const cat = new Category(payload);

    await cat.save();
    return res.status(201).json({ category: cat });
})




const updateCategory = tryCatch(async (req, res) => {

    const categoryId = req.params.id;

    const categoryP = await Category.findById(categoryId)

    if (req.file) {
        req.body.display = await sharp(req.file.buffer).resize({ width: 1440, height: 1080 }).png().toBuffer()
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ["parentId", "name", "display"]
    
    const isValid = updates.every(update => allowedUpdates.includes(update))
    
    if (!isValid) throw new customError("Cannot change some credentials!", 403);

    updates.forEach(update => {
        categoryP[update] = req.body[update];
    })
    
    const category = await categoryP.save();

    return res.status(201).json(category);

})




const deleteCategory = tryCatch(async (req, res) => {

    const categoryId = req.params.id;

    if (!categoryId) throw new customError("No category defined for delete!", 400);

    const deletedCat = await Category.findByIdAndDelete({ _id: categoryId })

    return res.status(200).json({ ...deletedCat._doc });
})




const getOneCategory = tryCatch(async (req, res) => {
    const catId = req.params.id
    
    const category = await Category.findOne({_id: catId})

    if (!category) throw new customError("No category data found", 404)

    return res.status(200).json({category})
})



const getAllCategories = tryCatch(async (req, res) => {

    const categories = await Category.find({}).exec()

    if (!categories) throw new customError("No categories exist!", 500);

    const CategoryList = createCategories(categories);

    return res.status(200).json({
        CategoryList
    })

})



module.exports = {
    addCategory,
    updateCategory,
    getOneCategory,
    deleteCategory,
    getAllCategories
}
