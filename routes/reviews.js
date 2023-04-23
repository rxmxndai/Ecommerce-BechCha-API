const router = require("express").Router()
const customError = require("../utils/customError");
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");
const { deleteReview, addReview, getAllReviews } = require("../controller/review");

const multer = require("multer")

const upload = multer({
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/)) {
            return callback(new customError("File must be an Image.", 400));
        }

        callback(undefined, true);
    }
})

// add reviews
router.post("/", verifyTokenAndAuthorization, upload.none(), addReview);

// delete reviews
router.delete("/:id", verifyTokenAndAuthorization, deleteReview)





module.exports = router;