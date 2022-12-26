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
            category,
            msg: "Category added successfully"
        })
    });

})



router.get("/", async (req, res) => {
    const categories = Category.find({}).exec()

    if (!categories) return res.status(404).json({msg: "No products found"})

    return res.status(200).json({
        categories
    })
})


module.exports = router

