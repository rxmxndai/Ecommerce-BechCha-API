
const Cart = require("../models/Cart");
const router = require("express").Router();
const {  verifyTokenAndAdmin, verifyTokenAndAuthorization }  = require("./verifyToken");




// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, async (req, res, next) => {
    
    const newCart = new Cart(req.body)

    try {
        const savedCart = await newCart.save();
        res.status(201).json(savedCart);
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


// update cart
router.put( "/:id", verifyTokenAndAuthorization, async (req, res) => {
        
        try {
            const updatedCart = await Cart.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )  

            res.status(201).json( updatedCart );
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



// get particular cart
router.get("/find/:userid", verifyTokenAndAuthorization, async (req, res) =>{
    try {
        const cart = await Cart.findOne( {userId: req.params.userid} )

        if (!cart) throw new Error("No record found")

        res.status(200).json(cart)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )



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