const Category = require("../../models/Category")
const tryCatch = require("../../utils/tryCatch");
const slugify = require("slugify");
const customError = require("../../utils/customError");


const createCategories = (categories, parentId = null) => {
    const CategoriesList = [];
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
            // recursive calls for children with same data as parent Cat
            children: createCategories(categories, each._id)
        })
    }

    return CategoriesList;
}



const addCategory = tryCatch(async (req, res) => {
    const payload = {
        name: req.body.name,
        slug: slugify(req.body.name)
    }

    if (req.body.parentId) payload.parentId = req.body.parentId;

    const cat = new Category(payload);

    await cat.save();
    return res.status(201).json({ category: cat });
})



const deleteCategory = tryCatch(async (req, res) => {

    const categoryId = req.params.id;

    if (!categoryId) throw new customError("No category defined for delete!", 400);

    const deletedCat = await Category.findByIdAndDelete({ _id: categoryId })

    return res.status(200).json({ ...deletedCat._doc });
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
    deleteCategory,
    getAllCategories
}
