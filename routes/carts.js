const { addToCart, getMyCart, deleteMyCart } = require("../controller/cart");
const Cart = require("../models/Cart");
const router = require("express").Router();
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");

const multer = require("multer");

const upload = multer();

// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, upload.none(""), addToCart);

// get particular cart
router.get("/", verifyTokenAndAuthorization, getMyCart);

// DELETE PARTICULAR CART
router.delete("/", verifyTokenAndAuthorization, deleteMyCart);


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



module.exports = router