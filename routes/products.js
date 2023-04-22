const router = require("express").Router();
const { verifyTokenAndAdmin }  = require("../middlewares/auth");
const { addProduct, updateProduct, deleteProduct, getOneProduct, getAllProducts, getCategoricalDistribution } = require("../controller/product");
const customError = require("../utils/customError");
const multer = require("multer");


const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
            return callback(new customError("File must be an Image.", 400));
        }

        callback(undefined, true);
    }
})

// add products
router.post("/", verifyTokenAndAdmin, upload.array("images"), addProduct)

// update prod
router.patch( "/:id", verifyTokenAndAdmin, upload.array("images"), updateProduct)

// delete product
router.delete("/:id", verifyTokenAndAdmin, deleteProduct)

// get categorical distribution data
router.get("/categorical-distribution", verifyTokenAndAdmin, getCategoricalDistribution)

// get particular product
router.get("/:id", getOneProduct)

// get all products
router.get("/", getAllProducts)





module.exports = router