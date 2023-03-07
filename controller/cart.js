const Cart = require("../models/Cart");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch")

// ADD ITEMS TO AUTHENTICATED USERS
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

// RETURN CART ALONG WITH THE PRODUCTS FIELD POPULATED
const getMyCart = tryCatch(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate(["cart.product"])

    if (!cart) return res.status(200).json([]);

    return res.status(200).json(cart);
})

// EMPTY CART CONTROLLER
const deleteMyCart = tryCatch(async (req, res) => {

    await Cart.findOneAndDelete({ user: req.user._id })

    return res.status(202).json("Emptied")
})


// increment || decrement product's quantity from cart
const updateCart = tryCatch(async (req, res) => {

    let { product, type, max, currentPrice } = req.body;
    max = Number(max);

    if (!product || !type) throw new customError("Needs a cart item and type!", 400);

    // find user's cart
    const user = await Cart.findOne({ user: req.user._id })

    if (!user) throw new customError("Invalid request! No cart!", 400);

    // if cart exists update cart

    let condition, action;

    // check for exact product in the same cart
    const item = user.cart.find(c => c.product.toString() == product)

    if (!item) throw new customError("Could not update this product!", 400)

    // check qty exceeds maxQuantiy or is less than 0?
    const qty = item.quantity;

    switch (type) {
        case "inc":
            if (qty+1 > max) throw new customError("Product exceeds stock!", 400);
            break;
        case "dec":
            if ( qty-1 <= 0 ) throw new customError("Delete cartItem instead!", 400);
            break;
        default: 
            break;
    }
   

    // now if quantity is also valid and product Item in cart is found!
    condition = { user: req.user._id, "cart.product": product }
    action = {
        "$set": {
            "cart.$.quantity": type === "inc" ? 1+qty : qty-1,
            "cart.$.price": currentPrice
        }
    }
    
    const updatedCart = await Cart.findOneAndUpdate(condition, action, { new: true })

    return res.status(200).json(updatedCart);
})

// DELETE PARTICULAR PRODUCT FROM CART
const deleteProductFromCart = tryCatch( async(req, res) => {
    const id = req.params.productId;

    const user = await Cart.findOne({user: req.user._id});
    if (!user) throw new customError("User have no cart!", 404)

    const item = user.cart.filter(c => c.product.toString() !== id);
    if (!item) throw new customError("User have no such product in cart!", 404)



    const condition = { user: req.user._id }
    const action = {
        "$set": {
            cart: item,
        }
    }

    const cartItem = await Cart.findOneAndUpdate(condition, action, {new: true});
    
    return res.status(202).json();
})



module.exports = {
    addToCart,
    getMyCart,
    updateCart,
    deleteMyCart,
    deleteProductFromCart
}