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
} = require("../controller/users")



const User = require("../models/User");

const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const { tryCatch } = require("../utils/tryCatch");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const multer = require("multer");



// register user
router.post("/register", registerUser);


// verify OTP
router.post("/verifyOTP", verifyOTP)



// login user
router.post("/login", loginUser);


// logout user
router.delete("/logout/:id", verifyTokenAndAuthorization, logoutUser);


// update user
router.put("/:id", verifyTokenAndAuthorization, updateUser);


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
            return callback(new Error("File must be an image."))
        }
        callback(undefined, true)
    }
});


router.post("/uploadpic", verifyTokenAndAuthorization, upload.single("upload"), uploadProfile)


// delete profile pic
router.delete("/deletepic", verifyTokenAndAuthorization, deleteProfile);


// delete profile pic
router.get("/profile/:id", verifyTokenAndAdmin, getProfile);



module.exports = router