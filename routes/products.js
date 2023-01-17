const router = require("express").Router();
const multer = require("multer")
const { verifyTokenAndAdmin }  = require("../middlewares/auth");
const { addProduct, updateProduct, deleteProduct, getOneProduct, getAllProducts } = require("../controller/Product/product");
const customError = require("../utils/customError");


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
            return callback(new customError("File must be an Image.", 400));
        }

        callback(undefined, true);
    }
})


// add products
router.post("/", verifyTokenAndAdmin, upload.array("prodImage"), addProduct)


// update prod
router.put( "/:id", verifyTokenAndAdmin, updateProduct)

// delete product
router.delete("/:id", verifyTokenAndAdmin, deleteProduct)

// get particular product
router.get("/find/:id", getOneProduct)

// get all products
router.get("/", getAllProducts)


module.exports = router