const Category = require("../../models/Category")
const tryCatch = require("../../utils/tryCatch");
const slugify = require("slugify");
const customError = require("../../utils/customError");
const { getDataUri } = require("../../utils/dataURI");
const cloudinary = require("cloudinary").v2;

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
            image: each.image.url,
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


    if (req.body.parentId) {
        await Category.findById(req.body.parentId)
        payload.parentId = req.body.parentId;
    }

    const category = new Category(payload);

    const file = req?.file;
    if (file) {
        const fileURI = file && getDataUri(file);
        const myCloud = await cloudinary.uploader.upload(fileURI.content)
        category.image = {
            public_id: myCloud.public_id,
            url: myCloud.url,
        }
    }

    const cat = await category.save();

    return res.status(201).json({ category: cat });
})




const updateCategory = tryCatch(async (req, res) => {

    const categoryId = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["parentId", "name", "image"]
    
    const isValid = updates.every(update => allowedUpdates.includes(update))
    
    if (!isValid) throw new customError("Cannot change some credentials!", 403);


    const categoryP = await Category.findById(categoryId)

    const file = req?.file;
    if (file) {
        const fileURI = getDataUri(file);
        const myCloud = await cloudinary.uploader.upload(fileURI.content)

        await cloudinary.uploader.destroy(categoryP.image.public_id);
        categoryP.image = {
            public_id: myCloud.public_id,
            url: myCloud.url,
        }
    }

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

    await cloudinary.uploader.destroy(deletedCat.image.public_id);

    return res.status(200).json({ ...deletedCat._doc });
})


const getOneCategory = tryCatch(async (req, res) => {
    const catId = req.params.id
    const category = await Category.findOne( { _id: catId })
    if (!category) throw new customError("No category data found", 404)

    let children = await Category.find({parentId: catId})

    return res.status(200).json( { category, children })
})



const getAllCategories = tryCatch(async (req, res) => {

    const categories = await Category.find({}).exec()

    if (!categories) throw new customError("No categories exist!", 500);

    let CategoryList;
    CategoryList = createCategories(categories);

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
