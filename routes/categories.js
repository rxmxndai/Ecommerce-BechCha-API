
const router = require("express").Router()  
const { verifyTokenAndAdmin } = require("../middlewares/auth")
const {
    addCategory,
    getAllCategories,
    deleteCategory
} = require("../controller/Categories/category")



// add categories
router.post("/add", verifyTokenAndAdmin, addCategory)


// get all categories
router.get("/", getAllCategories)


// Delete a category
router.delete("/:id", verifyTokenAndAdmin, deleteCategory)



module.exports = router     

