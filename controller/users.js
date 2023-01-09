const User = require("../models/User");

const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const multer = require("multer");
const { tryCatch } = require("../utils/tryCatch");



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



module.exports = {
    registerUser,
    loginUser,
    verifyOTP
}