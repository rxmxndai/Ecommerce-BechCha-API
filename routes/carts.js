const { addToCart, getMyCart, deleteMyCart, updateCart, deleteProductFromCart } = require("../controller/cart");
const Cart = require("../models/Cart");
const router = require("express").Router();
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");

const multer = require("multer");

const upload = multer();

// Every route here requires authentication

// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, upload.none(""), addToCart);

// get particular cart
router.get("/", verifyTokenAndAuthorization, getMyCart);

// DELETE PARTICULAR CART
router.delete("/", verifyTokenAndAuthorization, deleteMyCart);

// update cart
router.patch( "/", upload.none(""), verifyTokenAndAuthorization, updateCart)

// delete product from cart
router.delete("/:productId", verifyTokenAndAuthorization, deleteProductFromCart)

module.exports = router