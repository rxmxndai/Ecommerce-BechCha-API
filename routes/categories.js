
const router = require("express").Router()  
const { verifyTokenAndAdmin } = require("../middlewares/auth")
const {
    addCategory,
    updateCategory,
    getAllCategories,
    deleteCategory,
    getOneCategory
} = require("../controller/Categories/category")
const multer = require("multer")


const upload = multer({
    limits: {
        fileSize: 2000000 // 2mb
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
            return callback(new customError("File must be an Image.", 400));
        }

        callback(undefined, true);
    }
})


// add categories
router.post("/add", verifyTokenAndAdmin, upload.single("image"), addCategory)

// update category
router.patch("/:id", verifyTokenAndAdmin, upload.single("image"), updateCategory)

// get all categories
router.get("/", getAllCategories)

//get cat image
router.get("/:id", getOneCategory)

// Delete a category
router.delete("/:id", verifyTokenAndAdmin, deleteCategory)



module.exports = router     

