const router = require("express").Router();
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");
const { addAddress, updateAddress } = require("../controller/address");



// Every route here requires authentication

// create address of an autheticated user
router.post("/", verifyTokenAndAuthorization, addAddress);

// get particular cart
router.patch("/", verifyTokenAndAuthorization, updateAddress);


module.exports = router