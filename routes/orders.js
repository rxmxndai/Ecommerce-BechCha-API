const { addOrder, deleteOrder, getAllOrders, getSalesAnalytics, getOrdersAnalytics, getUserPercentage, getOneOrderById, cancelOrder, getUserOrders, updateOrder, sendInvoiceOfOrder } = require("../controller/order");
const router = require("express").Router();
const { verifyTokenAndAdmin, verifyTokenAndAuthorization } = require("../middlewares/auth");
const multer = require("multer");
const axios = require("axios")

const upload = multer();


// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization, upload.none(), addOrder);

// cancel order
router.post("/cancel/:id", verifyTokenAndAuthorization, cancelOrder)

// updates order
router.patch("/update/:id", verifyTokenAndAdmin, upload.none(), updateOrder)

// delete order
router.delete("/:id", verifyTokenAndAdmin, deleteOrder);

// get particular USER'S OREDER from an individual customer
router.get("/:id", verifyTokenAndAuthorization, getUserOrders);


// get particular order 
router.get("/user/:id", verifyTokenAndAuthorization, getOneOrderById);





// KHALTI request 
router.post("/pay-khalti", verifyTokenAndAuthorization,  upload.none(), async (req, res) => {
    console.log("check");
    try {
        // Extract data from request body
        const { token, amount } = req.body;

        console.log(token, amount);

        // Prepare data and config for Khalti API request
        const data = {
            token,
            amount
        };
        const config = {
            headers: {
                'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`
            }
        };

        // Make the request to Khalti API
        const response = await axios.post('https://khalti.com/api/v2/payment/verify/', data, config);

        console.log(response.data);

        // Send the response from Khalti API back to the client
        return res.send(response.data);
    } catch (error) {
        // console.log(error);
        // Send error response to the client
        return res.status(500).send('Error occurred while forwarding request');
    }
})



// get all cart items
// only accessible to admin
router.get("/", verifyTokenAndAdmin, getAllOrders);




// get monthly income
router.get("/sales/analytics", verifyTokenAndAdmin, getSalesAnalytics);


// get monthly orders count
router.get("/orders/analytics", verifyTokenAndAdmin, getOrdersAnalytics);


// get userCount Stats
router.get("/users/analytics", verifyTokenAndAdmin, getUserPercentage)



module.exports = router