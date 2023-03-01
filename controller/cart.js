const Cart = require("../models/Cart");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch")

// .populate(["userId", "products"])


const addToCart = tryCatch(async (req, res) => {

    const { product, quantity, price } = req.body;
    console.log(req.body);
    if (!product || !quantity || !price ) throw new customError("Needs a cart item!", 400);

    const cart = {
        product: product, quantity, price
    }

    

    const user = await Cart.findOne({ user: req.user._id })

    // if cart exists update cart
    let condition, action;
    if (user) {
        // check for duplicate proiducts in the same cart
        const item = user.cart.find(c => c.product.toString() == cart.product)
        const quantity = Number(cart.quantity);
        if (isNaN(quantity) || quantity <= 0) throw new customError("Invalid quantity", 400);

        if (item) {
            // console.log("Dupliocate found");
            condition = { user: req.user._id, "cart.product": cart.product }
            action = {
                "$set": {
                    "cart.$.quantity": cart.quantity + item.quantity,
                    "cart.$.price": cart.price
                }
            }
        }
        else {
            condition = { user: req.user._id }
            action = {
                "$push": {
                    "cart": cart
                }
            }
            // console.log("Dupliocate not found");
            

        }
        const updatedCart = await Cart.findOneAndUpdate(condition, action, { new: true } )
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




module.exports = {
    addToCart
}