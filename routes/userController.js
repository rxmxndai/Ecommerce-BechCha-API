const router = require("express").Router();
const User = require("../models/User");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("../middlewares/auth");
const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const { handleRefreshTokenAPI } = require("../middlewares/refreshTokenController")
const multer = require("multer");
const { tryCatch } = require("../utils/tryCatch");



// router.post("/auth/refresh", handleRefreshTokenAPI);

// register user
router.post("/register", tryCatch(async (req, res) => {
    // empty body?
    const duplicateUser = User.find({ email: req.body.email } || { username: req.body.username })

    if (duplicateUser.length)
        return res.status(409).json({ msg: `User with same email exists already. ${duplicateUser}` })


    const result = JOIuserSchemaValidate(req.body);
    const { error, value } = result;
    const valid = error == null;

    if (!valid) {
        return res.status(900).json({
            Error: error.details,
            msg: "Not valid credentials"
        })
    }

    const user = new User(value);

    await user.save();
    // await sendOTPverificationEmail({id: user._id, email: user.email}, res)
    return res.status(201).json(user);
}));


// verify OTP
router.post("/verifyOTP", async (req, res) => {

    try {
        let { userId, otp } = req.body;


        if (!userId || !otp) {
            return res.status(500).json({ msg: "Empty OTP entered" })
        }

        otp = otp.toString();
        console.log("userId", userId);
        const userOTPrecord = await OTPmodel.findOne({ userId })
        console.log(userOTPrecord, "OTP RECORDS");
        const expiresAt = userOTPrecord?.expiresAt;
        const hashedOTP = userOTPrecord?.otp;


        // otp expired?
        if (expiresAt < Date.now()) {
            await OTPmodel.deleteMany({ userId: userId });
            return new Error("OTP's verification time has expired. Please request for new one.")
        }

        // true or false
        var validOTP = await decryptHashedPass({
            password: otp,
            hashedPassword: hashedOTP
        })

        if (!validOTP) return res.status(403).json({ msg: "OTP do not match" });

        // for success
        await User.updateOne({ _id: userId }, { isVerified: true })

        res.status(200).json({
            status: "VERIFIED",
            msg: "User email has been verified"
        })

    }

    catch (err) {
        res.status(500).json({
            cause: err.message,
            msg: "OTP  mismatch"
        });
    }
})



// login user
router.post("/login", async (req, res) => {
    const cookies = req.cookies;

    const user = await User.findOne({ email: req.body.email }).exec();

    if (!user) return res.status(401).json("No such user registered."); // unauthorized

    const validPass = await decryptHashedPass({
        password: req.body.password,
        hashedPassword: user.password
    });

    if (!validPass) {
        return res.status(401).json("No such user registered.");
    }

    // create access token
    const tokens = await user.generateAuthToken("30d", "10s");

    const newRefreshToken = tokens.refreshToken;
    const accessToken = tokens.accessToken;

    let newRefreshTokenArray = cookies?.jwt ?
        user.refreshToken.filter(token => token !== cookies.jwt)
        : user.refreshToken


    if (cookies?.jwt) {
        const refreshToken = cookies.jwt;
        const foundToken = await User.findOne({ refreshToken }).exec()

        // if detected reuse of refresh token
        if (!foundToken) {
            console.log("Attempted refresh token reuse at login");
            newRefreshTokenArray = [];
        }
        res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
    }

    // Saving refreshToken with current user
    user.refreshToken = [...newRefreshTokenArray, newRefreshToken];



    // set refresh token in cookie
    const options = {
        sameSite: "None",
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        // secure: true
    };

    try {
        await user.save();
        res.cookie('jwt', newRefreshToken, options);
        console.log("Login Successful");
        const { refreshToken, password, ...rest } = user._doc;
        // send authorization roles and access token to user
        res.status(200).json({ ...rest, accessToken });


    } catch (err) {
        return res.status(500).json(err);
    }
});



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