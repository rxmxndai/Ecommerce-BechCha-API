const Cart = require("../models/Cart");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch")

// .populate(["userId", "products"])


const addToCart = tryCatch(async (req, res) => {

    const { product, quantity, price, max } = req.body;

    if (!product || !quantity || !price) throw new customError("Needs a cart item!", 400);

    const cart = {
        product: product, quantity: Number(quantity), price: Number(price)
    }

    const user = await Cart.findOne({ user: req.user._id })

    // if cart exists update cart
    let condition, action;
    if (user) {
        // check for duplicate proiducts in the same cart
        const item = user.cart.find(c => c.product.toString() == cart.product)
        const qty = cart.quantity;
        
        if (isNaN(qty) || qty <= 0 || qty > Number(max)) {
            throw new customError("Invalid quantity", 400);
        }

        if (item) {
            if ((item.quantity + cart.quantity) > Number(max)) {

                throw new customError("Quantity exceeds stock", 400);
            }
            // console.log("Dupliocate found");
            condition = { user: req.user._id, "cart.product": cart.product }
            action = {
                "$set": {
                    "cart.$.quantity": qty + item.quantity,
                    "cart.$.price": cart.price
                }
            }
        }
        else {
            // console.log("Dupliocate not found");
            condition = { user: req.user._id }
            action = {
                "$push": {
                    "cart": cart
                }
            }
        }
        const updatedCart = await Cart.findOneAndUpdate(condition, action, { new: true })
        return res.status(200).json(updatedCart);
    }
    else {
        // create new cart
        const cartItem = {
            user: req.user._id,
            cart: [cart]
        }
        const _cart = new Cart(cartItem)
        await _cart.save();
        return res.status(201).json({ cart: _cart });
    }
})




const getMyCart = tryCatch(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate(["cart.product"])

    if (!cart) throw new customError("empty", 404);

    return res.status(200).json(cart);
})


const deleteMyCart = tryCatch(async (req, res) => {
    
    await Cart.findOneAndDelete( {user: req.user._id} )
    
    return res.status(202).json("Emptied")
})


module.exports = {
    addToCart,
    getMyCart,
    deleteMyCart
}