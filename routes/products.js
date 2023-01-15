const Product = require("../models/Product");
const Category  = require("../models/Category");
const router = require("express").Router();
const path = require("path")

const multer = require("multer")
const shortid = require("shortid")
const { verifyTokenAndAdmin }  = require("../middlewares/auth");
const { JOIproductSchemaValidate } = require("../middlewares/JoiValidator");
const { addProduct, updateProduct, deleteProduct, getOneProduct, getAllProducts } = require("../controller/Product/product");



const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, path.join(path.dirname(__dirname), "products"));
    },
    filename: function (req, file, callback) {
        callback(null, shortid.generate() + "-" + file.originalname)
    }
})


const upload = multer({storage: storage})

// add products
router.post("/", verifyTokenAndAdmin, upload.single("prodImage"), addProduct)


// update prod
router.put( "/:id", verifyTokenAndAdmin, updateProduct)

// delete product
router.delete("/:id", verifyTokenAndAdmin, deleteProduct)

// get particular product
router.get("/find/:id", getOneProduct)

// get all products
router.get("/", getAllProducts)


module.exports = router