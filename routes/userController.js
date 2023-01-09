const router = require("express").Router();
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("../middlewares/auth");
const {
    registerUser,
    loginUser

} = require("../controller/users")




router.post("/auth/refresh", handleRefreshTokenAPI);


// register user
router.post("/register", registerUser);


// verify OTP
router.post("/verifyOTP", verifyOTP)



// login user
router.post("/login", loginUser);



router.delete("/logout/:id", verifyTokenAndAuthorization, async (req, res) => {
    // On client, also delete the accessToken

    const cookies = req.cookies;
    // console.log(cookies.jwt);
    if (!cookies?.jwt) return res.sendStatus(204); //No content

    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    try {
        // Delete refreshToken in db
        foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);;
        const result = await foundUser.save();

        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        res.status(200).json(result);
    }
    catch (err) {
        return res.status(500).json({ err: err.message, msg: "Already logged out!" })
    }
})


// update user
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        )

        res.status(201).json(user);
    }
    catch (err) {
        res.status(500).json(err)
    }
})


router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {

    try {
        const deletedUser = await User.findByIdAndDelete(req.user._id)

        if (!deletedUser) throw new Error("No record found")

        res.status(202).json(deletedUser)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get particular user
router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user) throw new Error("No record found")

        res.status(200).json(user)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})

// get all user
router.get("/find", verifyTokenAndAdmin, async (req, res) => {

    // query
    const query = req.query.new

    try {
        // sort ({parameter: asc or desc})
        // limit => pagination (limit(how many))
        const users = query ? await User.find({}).sort({ _id: -1 }).limit(1) : await User.find({});

        if (!users) throw new Error("No record found")

        res.status(200).json(users)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


// get user stats

router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    try {
        const data = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastYear }
                }
            },
            {
                $project: {
                    month: { $month: "$createdAt" }
                }
            },
            {
                $group: {
                    _id: "$month",
                    total: { $sum: 1 }
                }
            }
        ])

        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})




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


router.post("/uploadpic", verifyTokenAndAuthorization, upload.single("upload"), async (req, res) => {
    req.user.profile = req.file.buffer

    const user = req.user;
    await user.save();
    const { refreshToken, password, profile, ...rest } = user._doc;
    res.status(200).json({ ...rest });
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
}
)

router.delete("/deletepic", verifyTokenAndAuthorization, async (req, res) => {
    req.user.image = undefined
    await req.user.save()
    res.send();
})



router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.profile) {
            throw new Error()
        }

        res.set("Content-Type", "image/jpg")
        res.send(user.profile)
    }
    catch (error) {
        res.status(404).json({ error })
    }
})



module.exports = router