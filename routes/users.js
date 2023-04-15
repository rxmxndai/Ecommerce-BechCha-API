const router = require("express").Router();
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("../middlewares/auth");
const {
    registerUser,
    loginUser,
    verifyOTP,
    logoutUser,
    updateUser,
    deleteUser,
    getOneUser,
    getAllUser, 
    getStatsUser,
    resendOTP,
    getUsersShippingDetails
} = require("../controller/user")

const multer = require("multer");
const customError = require("../utils/customError");
const { handleRefreshToken } = require("../middlewares/refreshTokenController");



// image upload using multer
const upload = multer({
    limits: {
        fileSize: 2000000 //1mb file size
    },  
    fileFilter(req, file, callback) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new customError("File must be an image.", 400))
        }
        callback(undefined, true)
    }
});


// register user
router.post("/register", upload.single("image"), registerUser);


// verify OTP
router.post("/verifyOTP", verifyOTP);

// resend OTP
router.post("/resendOTP", resendOTP);

// login user
router.post("/login", loginUser);


// logout user
router.delete("/logout/:id", verifyTokenAndAuthorization, logoutUser);


// update user
router.patch("/:id", verifyTokenAndAuthorization, upload.single("image"), updateUser);


// delete user
router.delete("/:id", verifyTokenAndAuthorization, deleteUser);


// get particular user
router.get("/find/:id", verifyTokenAndAuthorization, getOneUser);

// get all user
router.get("/find", verifyTokenAndAdmin, getAllUser);


// get user stats
router.get("/stats", verifyTokenAndAdmin, getStatsUser);


// get shipping details
router.get("/shipping/:id", verifyTokenAndAuthorization, getUsersShippingDetails);


// refresh token
router.get("/refresh", handleRefreshToken);




module.exports = router