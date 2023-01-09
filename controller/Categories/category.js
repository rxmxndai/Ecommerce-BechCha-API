const Category = require("../../models/Category")
const tryCatch = require("../../utils/tryCatch");
const slugify = require("slugify")


const createCategories = (categories, parentId = null) => {
    const CategoriesList = [];
    let category;

    if (parentId == null) {
        category = categories.filter( (cat) => cat.parentId == undefined )
    }
    else {
        category = categories.filter( (cat) => {
            cat.parentId == parentId;
        })
    }

    for ( let each of category ) {
        CategoriesList.push({
            _id: each._id,
            name: each.name,
            slug: each.slug,
            children: createCategories(categories, each._id)
        })
    }

    return CategoriesList;
}



const addCategory = tryCatch( async (req, res) => {
    const payload = {
        name: req.body.name,
        slug: slugify(req.body.name)
    }

    if (req.body.parentId)  payload.parentId = req.body.parentId;

    const cat = new Category(payload);
    
    await cat.save();
    console.log(cat);
    return res.status(201).json(...cat);
})



const deleteCategory = tryCatch( async (req, res) => {
    const categoryId = req.params.id;

    if (!categoryId) return res.status(204).json("No category selected")
    console.log(categoryId);

        const deletedCat = await Category.findByIdAndDelete( categoryId )

        if (!deletedCat) throw new Error("No record found")

        return res.status(200).json({...deletedCat._doc});
    }
)




const getAllCategories = tryCatch(async (req, res) => {

        const categories = await Category.find({}).exec()
        
        if (!categories) return res.status(400).json({msg: "No products found"})
        
        const CategoryList = createCategories(categories);
    
        return res.status(200).json({
            categories
        })

})



module.exports = {
    addCategory,
    deleteCategory,
    getAllCategories
}
