
const Order = require("../models/Order");
const router = require("express").Router();
const {  verifyTokenAndAdmin, verifyTokenAndAuthorization }  = require("./verifyToken");




// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, async (req, res, next) => {
    
    const order = new Order(req.body)

    try {
        const savedOrder = await order.save();
        res.status(201).json(savedOrder);
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


// update order
router.put( "/:id", verifyTokenAndAdmin, async (req, res) => {
        
        try {
            const updatedOrder = await Order.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )  

            res.status(201).json( updatedOrder );
        }
        catch (err) {
            res.status(500).json(err)
        }
})


router.delete("/:id", verifyTokenAndAdmin, async (req, res, next) => {
    
    try {
        const deletedOrder = await Order.findByIdAndDelete( req.params.id )

        if (!deletedOrder) throw new Error("No record found")


        const {...products} = deletedOrder._doc;

        res.status(200).json({ ...products , msg: "Order deleted"})
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get particular order from an individual customer
router.get("/find/:userid", verifyTokenAndAuthorization, async (req, res) =>{
    try {
        const orders = await Order.find( {userId: req.params.userid} )

        if (!orders) throw new Error("No record found")

        res.status(200).json(orders)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )



// get all cart items
// only accessible to admin

router.get("/", verifyTokenAndAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
        res.status(200).json(orders)
    }
    catch (err) {
        res.status(500).json(err);
    }
})


module.exports = router