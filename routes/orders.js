const { addOrder, deleteOrder, updateOrder, getAllOrders, getOneOrder, getSalesAnalytics, getOrdersAnalytics, getUserPercentage } = require("../controller/order");
const router = require("express").Router();
const {  verifyTokenAndAdmin, verifyTokenAndAuthorization }  = require("../middlewares/auth");
const multer = require('multer');
const upload = multer();



// create cart (for all authenticated users)
router.post("/", verifyTokenAndAuthorization,  upload.none(), addOrder);


// update order
router.put( "/:id", verifyTokenAndAuthorization, updateOrder);


router.delete("/:id", verifyTokenAndAuthorization, deleteOrder);


// get particular order from an individual customer
router.get("/:id", verifyTokenAndAuthorization, getOneOrder);


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