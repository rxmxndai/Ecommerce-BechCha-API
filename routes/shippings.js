const router = require("express").Router();
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");
const { addDetails, updateDetails } = require("../controller/shipping");
const multer = require("multer")


const upload = multer()

// create address of an autheticated user
router.post("/", verifyTokenAndAuthorization, upload.none(''), addDetails);

// update particular shipping details
router.patch("/", verifyTokenAndAuthorization, updateDetails);



module.exports = router