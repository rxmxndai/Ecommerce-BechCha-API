const { addToCart, getMyCart } = require("../controller/cart");
const Cart = require("../models/Cart");
const router = require("express").Router();
const {  verifyTokenAndAdmin, verifyTokenAndAuthorization }  = require("../middlewares/auth");

const multer = require("multer");

const upload = multer();

// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, upload.none(""), addToCart);

// get particular cart
router.get("/", verifyTokenAndAuthorization, getMyCart);

// update cart
router.patch( "/:id", verifyTokenAndAuthorization, async (req, res) => {
        
        try {
            const updatedCart = await Cart.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )

            returnres.status(201).json( updatedCart );
        }
        catch (err) {
            res.status(500).json(err)
        }
})


router.delete("/:id", verifyTokenAndAuthorization, async (req, res, next) => {
    
    try {
        const deletedCart = await Cart.findByIdAndDelete( req.params.id )

        if (!deletedCart) throw new Error("No record found")


        const {...products} = deletedCart._doc;

        res.status(200).json({ ...products , msg: "Cart Emptied"})
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})






// get all cart items
// only accessible to admin

router.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
        const carts = await Cart.find()
        res.status(200).json(carts)
    }
    catch (err) {
        res.status(500).json(err);
    }
})


module.exports = router