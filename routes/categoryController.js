const Category = require("../models/Category")
const router = require("express").Router()
const slugify = require("slugify")
const { verifyTokenAndAdmin } = require("../middlewares/auth")

router.post("/add", verifyTokenAndAdmin, (req, res) => {
    const payload = {
        name: req.body.name,
        slug: slugify(req.body.name)
    }
    
    if (!req.body.name) { return res.status(400).json({msg: "Category name required !"}) }

    if (req.body.parentId)  payload.parentId = req.body.parentId;

    const cat = new Category(payload);
    
    cat.save((err, category) => {
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



router.get("/", async (req, res) => {

    try {

        const categories = await Category.find({}).exec()
        
        if (!categories) return res.status(400).json({msg: "No products found"})
        
        return res.status(200).json({
            categories
        })
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


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

