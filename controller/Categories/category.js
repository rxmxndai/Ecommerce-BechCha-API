import User from "../../models/User";
import tryCatch from "../../utils/tryCatch";



const addCategory = tryCatch( async (req, res) => {
    const payload = {
        name: req.body.name,
        slug: slugify(req.body.name)
    }
    
    if (!req.body.name) { return res.status(400).json({msg: "Category name required !"}) }

    if (req.body.parentId)  payload.parentId = req.body.parentId;

    const cat = new Category(payload);
    
    await cat.save((err, category) => {
        if (err) return res.status(400).json({
            err,
            msg: "Unable to add Category !"
        })

        return res.status(201).json({
            ...category._doc,
            msg: "Category added successfully"
        })
    });
})



const deleteCategory = tryCatch()




const getAllCategory = tryCatch(async (req, res) => {
    try {
        const categories = await Category.find({}).exec()
        
        if (!categories) return res.status(400).json({msg: "No products found"})
        
        const CategoryList = createCategories(categories);
    
        return res.status(200).json({
            categories
        })
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



module.exports = {
    addCategory,
    deleteCategory,
    getAllCategory
}
