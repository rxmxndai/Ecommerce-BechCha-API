const { addOrder, deleteOrder, getAllOrders, getOneOrder, getSalesAnalytics, getOrdersAnalytics, getUserPercentage, getOneOrderById, cancelOrder } = require("../controller/order");
const router = require("express").Router();
const {  verifyTokenAndAdmin, verifyTokenAndAuthorization }  = require("../middlewares/auth");
const multer = require('multer');
const upload = multer();



// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization,  upload.none(), addOrder);

// delete order
router.delete("/:id", verifyTokenAndAdmin, deleteOrder);

// get particular USER'S OREDER from an individual customer
router.get("/me", verifyTokenAndAuthorization, getOneOrder);

// get particular order 
router.get("/:id", verifyTokenAndAuthorization, getOneOrderById);

// get all cart items
// only accessible to admin
router.get("/", verifyTokenAndAdmin, getAllOrders);

// cancel order
router.post("/cancel/:id", verifyTokenAndAuthorization, cancelOrder)


// get monthly income
router.get("/sales/analytics", verifyTokenAndAdmin, getSalesAnalytics);


// get monthly orders count
router.get("/orders/analytics", verifyTokenAndAdmin, getOrdersAnalytics);


// get userCount Stats
router.get("/users/analytics", verifyTokenAndAdmin, getUserPercentage)


module.exports = router