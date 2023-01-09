const User = require("../models/User");

const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const { tryCatch } = require("../utils/tryCatch");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const multer = require("multer");



const registerUser = tryCatch(async (req, res) => {
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
})



const loginUser = tryCatch(async (req, res) => {
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
    await user.save();
    res.cookie('jwt', newRefreshToken, options);
    console.log("Login Successful");
    const { refreshToken, password, ...rest } = user._doc;
    // send authorization roles and access token to user
    res.status(200).json({ ...rest, accessToken });
});



const verifyOTP = tryCatch(async (req, res) => {

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


})



const logoutUser = tryCatch(async (req, res) => {
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

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);;
    const result = await foundUser.save();

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.status(200).json(result);
})



const updateUser = tryCatch(async (req, res) => {

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            $set: req.body,
        },
        { new: true }
    )

    return res.status(201).json(user);
})


const deleteUser = tryCatch(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.user._id)

    if (!deletedUser) throw new Error("No record found")

    return res.status(202).json(deletedUser)
})


const getOneUser = tryCatch(async (req, res) => {

    const user = await User.findById(req.params.id)

    if (!user) throw new Error("No record found")

    return res.status(200).json(user)
})


const getAllUser = tryCatch(async (req, res) => {

    // query
    const query = req.query.new

    // sort ({parameter: asc or desc})
    // limit => pagination (limit(how many))
    const users = query ? await User.find({}).sort({ _id: -1 }).limit(1) : await User.find({});

    if (!users) throw new Error("No record found")

    return res.status(200).json(users)
})



const getStatsUser = tryCatch(async (req, res) => {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

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

    return res.status(200).json(data);
})


const uploadProfile = tryCatch(async (req, res) => {
    req.user.profile = req.file.buffer

    const user = req.user;
    await user.save();
    const { refreshToken, password, profile, ...rest } = user._doc;
    res.status(200).json({ ...rest });
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})




const deleteProfile = tryCatch(async (req, res) => {
    req.user.image = undefined
    await req.user.save()
    res.send();
})

const getProfile = tryCatch(async (req, res) => {
        const user = await User.findById(req.params.id)
        if (!user || !user.profile) {
            throw new Error("User has no profile")
        }

        res.set("Content-Type", "image/jpg")
        res.send(user.profile)
})



module.exports = {
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
}