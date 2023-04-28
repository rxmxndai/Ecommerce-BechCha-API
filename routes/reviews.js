const router = require("express").Router()
const customError = require("../utils/customError");
const { verifyTokenAndAuthorization }  = require("../middlewares/auth");
const { deleteReview, addReview, getAllReviews } = require("../controller/review");

const multer = require("multer")

const upload = multer({
    limits: {
        fileSize: 10000000
    },
})

// add reviews
router.post("/", verifyTokenAndAuthorization, upload.none(), addReview);

// delete reviews
router.delete("/:id/:user", verifyTokenAndAuthorization, deleteReview)





module.exports = router;