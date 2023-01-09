const User = require("../models/User");

const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const tryCatch = require("../utils/tryCatch");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const multer = require("multer");
const customError = require("../utils/customError");



const registerUser = tryCatch(async (req, res) => {
    // empty body?
    const duplicateUser = User.find({ email: req.body.email } || { username: req.body.username })

    if (duplicateUser.length)
        throw new customError("Duplicate Document Error", 403)


    const result = JOIuserSchemaValidate(req.body);
    const { error, value } = result;
    const valid = error == null;

    if (!valid) throw new customError("User Info validation failed", 400)

    const user = new User(value);

    await user.save();
    // await sendOTPverificationEmail({id: user._id, email: user.email}, res)
    return res.status(201).json(user);
})




const loginUser = tryCatch(async (req, res) => {
    const cookies = req.cookies;

    const user = await User.findOne({ email: req.body.email }).exec();

    if (!user) throw new customError("No user found", 404);

    const validPass = await decryptHashedPass({
        password: req.body.password,
        hashedPassword: user.password
    });

    if (!validPass) {
        throw new customError("No user found", 404);
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
            // console.log("Attempted refresh token reuse at login");
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
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        // secure: true
    };
    await user.save();
    res.cookie('jwt', newRefreshToken, options);
    const { refreshToken, password, ...rest } = user._doc;
    // send authorization roles and access token to user
    return res.status(200).json({ ...rest, accessToken });
});



const verifyOTP = tryCatch(async (req, res) => {

    let { userId, otp } = req.body;


    if (!userId || !otp) {
        throw new customError("OTP not provided!", 204)
    }

    otp = otp.toString();

    const userOTPrecord = await OTPmodel.findOne({ userId })
    const expiresAt = userOTPrecord?.expiresAt;
    const hashedOTP = userOTPrecord?.otp;


    // otp expired?
    if (expiresAt < Date.now()) {
        await OTPmodel.deleteMany({ userId: userId });
        throw new customError("OTP's verification time has expired. Please request for new one.", 401)
    }

    // true or false
    var validOTP = await decryptHashedPass({
        password: otp,
        hashedPassword: hashedOTP
    })

    if (!validOTP) throw new customError("OTP's verification failed", 401)

    // for success
    await User.updateOne({ _id: userId }, { isVerified: true })
    await OTPmodel.deleteMany({ userId: userId });

    return res.status(200).json({
        status: "VERIFIED",
        msg: "User email has been verified"
    })


})



const logoutUser = tryCatch(async (req, res) => {
    // On client, also delete the accessToken
    const cookies = req.cookies;
    // console.log(cookies.jwt);
    if (!cookies?.jwt) throw new customError("", 204)

    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        throw new customError("No login session detected", 400)
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

    if (!deletedUser) throw new customError("No USER record found", 404)

    return res.status(200).json(deletedUser)
})


const getOneUser = tryCatch(async (req, res) => {

    const user = await User.findById(req.params.id)

    if (!user) throw new customError("No USER record found", 404)

    return res.status(200).json(user)
})





const getAllUser = tryCatch(async (req, res) => {

    // query
    const query = req.query.new

    // sort ({parameter: asc or desc})
    // limit => pagination (limit(how many))
    const users = query ? await User.find({}).sort({ _id: -1 }).limit(1) : await User.find({});

    if (!users) throw new customError("No USER record found", 404)

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





const uploadProfile = tryCatch( async (req, res) => {
    console.log("check");
    req.user.profile = req.file.buffer
    const user = req.user;
    await user.save();
    const { refreshToken, password, profile, ...rest } = user._doc;
    res.status(200).json({ ...rest });
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