const router = require("express").Router();
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");
const multer = require("multer");
const { addAddress, updateAddress } = require("../controller/address");

const upload = multer();

// Every route here requires authentication

// create address of an autheticated user
router.post("/", verifyTokenAndAuthorization, upload.none(""), addAddress);

// get particular cart
router.patch("/", verifyTokenAndAuthorization, updateAddress);


module.exports = router