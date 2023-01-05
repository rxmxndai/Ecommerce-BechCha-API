const Product = require("../models/Product");
const router = require("express").Router();
const { verifyTokenAndAdmin }  = require("../middlewares/auth");




router.post("/", verifyTokenAndAdmin, async (req, res, next) => {
    
    const newProduct = new Product(req.body)

    try {
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


// update prod
router.put( "/:id", verifyTokenAndAdmin, async (req, res) => {
        
        try {
            const updatedProduct = await Product.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )  

            res.status(201).json( updatedProduct );
        }
        catch (err) {
            res.status(500).json(err)
        }
})


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
            products = await Product.find();
        }
        

        if (!products) throw new Error("No record found")

        res.status(200).json(...products)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )


module.exports = router