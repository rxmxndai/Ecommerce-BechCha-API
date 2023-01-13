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
    uploadProfile,
    getProfile,
    deleteProfile
} = require("../controller/Users/user")

const multer = require("multer");
const customError = require("../utils/customError");



// register user
router.post("/register", registerUser);


// verify OTP
router.post("/verifyOTP", verifyOTP)



// login user
router.post("/login", loginUser);


// logout user
router.delete("/logout/:id", verifyTokenAndAuthorization, logoutUser);


// update user
router.patch("/:id", verifyTokenAndAuthorization, updateUser);


// delete user
router.delete("/:id", verifyTokenAndAuthorization, deleteUser);


// get particular user
router.get("/find/:id", verifyTokenAndAdmin, getOneUser)

// get all user
router.get("/find", verifyTokenAndAdmin, getAllUser)


// get user stats

router.get("/stats", verifyTokenAndAdmin, getStatsUser)



// image upload using multer
const upload = multer({
    limits: {
        fileSize: 1000000 //1mb file size
    },
    fileFilter(req, file, callback) {

        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new customError("File must be an image.", 400))
        }
        callback(undefined, true)
    }
});

// upload profile pic
router.post("/profile/:id", verifyTokenAndAuthorization, upload.single("upload"), uploadProfile)


// delete profile pic
router.delete("/profile/:id", verifyTokenAndAuthorization, deleteProfile);


// get one profile pic
router.get("/profile/:id", verifyTokenAndAuthorization, getProfile);



module.exports = router