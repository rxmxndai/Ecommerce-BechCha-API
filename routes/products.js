const Product = require("../models/Product");
const Category  = require("../models/Category");

const router = require("express").Router();
const { verifyTokenAndAdmin }  = require("../middlewares/auth");
const { JOIproductSchemaValidate } = require("../middlewares/JoiValidator");
const { addProduct, updateProduct } = require("../controller/Product/product");


router.post("/", verifyTokenAndAdmin, addProduct)


// update prod
router.put( "/:id", verifyTokenAndAdmin, updateProduct)


router.delete("/:id", verifyTokenAndAdmin, async (req, res, next) => {
    
    try {
        const deletedProduct = await Product.findByIdAndDelete( req.params.id )

        if (!deletedProduct) throw new Error("No record found")


        const {...product} = deletedProduct._doc;

        res.status(200).json({ ...product , msg: "Product deleted"})
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get particular product
router.get("/find/:id", async (req, res) =>{
    try {
        const product = await Product.findById( req.params.id )

        if (!product) throw new Error("No record found")

        res.status(200).json(product)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )

// get all products
router.get("/", async (req, res) =>{

    // query
    const queryNew = req.query.new
    const queryCategoryID = req.query.category

    try {
        // sort ({parameter: asc or desc})
        // limit => pagination (limit(how many))

        let products;

        if (queryNew) {
            products= await Product.find()
                            // .sort({createdAt: -1}).limit()
        }
        else if (queryCategoryID) {
            products= await Product.find( {
                category: queryCategoryID
            })
            .sort({createdAt: -1}).limit()
        }
        else {
            products = await Product.find({});
        }
        
        if (!products) throw new Error("No record found")

        return res.status(200).json(products)
    }
    catch (err) {
        return res.status(500).json(err.message)
    }
} )


module.exports = router