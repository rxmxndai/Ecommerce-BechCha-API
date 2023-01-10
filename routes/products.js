const Product = require("../models/Product");
const Category  = require("../models/Category");

const router = require("express").Router();
const { verifyTokenAndAdmin }  = require("../middlewares/auth");
const { JOIproductSchemaValidate } = require("../middlewares/JoiValidator");
const { addProduct, updateProduct, deleteProduct, getOneProduct, getAllProducts } = require("../controller/Product/product");


router.post("/", verifyTokenAndAdmin, addProduct)


// update prod
router.put( "/:id", verifyTokenAndAdmin, updateProduct)

// delete product
router.delete("/:id", verifyTokenAndAdmin, deleteProduct)

// get particular product
router.get("/find/:id", getOneProduct)

// get all products
router.get("/", getAllProducts)


module.exports = router