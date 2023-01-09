const Category = require("../models/Category")
const router = require("express").Router()
const slugify = require("slugify")
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("../middlewares/auth")
const multer = require("multer")


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



router.post("/add", verifyTokenAndAdmin, addCategory)


// get all categories
router.get("/", getAllCategories)




router.delete("/:id", verifyTokenAndAdmin, async (req, res) => {
    const categoryId = req.params.id;

    if (!categoryId) return res.status(204).json("No category selected")
    console.log(categoryId);
    try {

        const deletedCat = await Category.findByIdAndDelete( categoryId )

        if (!deletedCat) throw new Error("No record found")

        return res.status(200).json({...deletedCat._doc});
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



module.exports = router

