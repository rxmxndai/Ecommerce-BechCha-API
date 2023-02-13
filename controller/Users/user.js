const User = require("../../models/User");
const sharp = require("sharp")
const { decryptHashedPass, sendOTPverificationEmail } = require("../../utils/utils");
const tryCatch = require("../../utils/tryCatch");
const OTPmodel = require("../../models/OTPverification");
const { JOIuserSchemaValidate } = require("../../middlewares/JoiValidator")
const customError = require("../../utils/customError");
const { cookieOptions } = require("../../middlewares/refreshTokenController");



const registerUser = tryCatch(async (req, res) => {
    // empty body?
    const { error, value } = await JOIuserSchemaValidate(req.body);
    if (error) throw new customError(`${error.details[0].message}`, 400);


    const user = new User(value);

    await user.save();
    await sendOTPverificationEmail({ email: user.email}, res, (err, message) => {
        if (err) throw new customError(err, 400)

        else {
            return res.status(201).json({user, message});
        }
    })
    
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

    if (!user.isVerified) throw new customError("Please verify OTP through email", 400)


    const newTokenArray =
        !cookies?.jwt ? user.refreshToken
            : user.refreshToken.filter(token => token != cookies.jwt);


    // create access token
    const tokens = await user.generateAuthToken();
    const newRefreshToken = tokens.refreshToken;
    const accessToken = tokens.accessToken;


    if (cookies?.jwt) {
        res.clearCookie("jwt", cookieOptions)
    }

    user.refreshToken = [...newTokenArray, newRefreshToken]
    await user.save();


    res.cookie('jwt', newRefreshToken, cookieOptions);

    const { refreshToken, password, ...rest } = user._doc;

    // send authorization roles and access token to user
    return res.status(200).json({ ...rest, accessToken });
});



const verifyOTP = tryCatch(async (req, res) => {

    let { email, otp } = req.body;
    
    const userOTPrecord = await OTPmodel.findOne({ email })
    const expiresAt = userOTPrecord?.expiresAt;
    const hashedOTP = userOTPrecord?.otp;


    // otp expired?
    if (expiresAt < Date.now()) {
        await OTPmodel.deleteMany({ email });
        throw new customError("OTP's verification time has expired. Please request for new one.", 401)
    }

    // true or false
    var validOTP = await decryptHashedPass({
        password: otp,
        hashedPassword: hashedOTP
    })

    if (!validOTP) throw new customError("OTP's verification failed", 401)

    // for success
    const user = await User.updateOne({ email }, { isVerified: true })
    await OTPmodel.deleteMany({ email });

    return res.status(200).json({
        user,
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

    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        secure: true 
    });
    return res.status(200).json(result);
})




const updateUser = tryCatch(async (req, res) => {

    const id = req.params.id;

    if (req.file) {
        console.log("File detected!");
        req.body.profile = await sharp(req.file.buffer).resize({ width: 500, height: 500 }).png().toBuffer()
    }

    const updates = Object.keys(req.body);

    const allowedUpdates = ["username", "email", "password", "profile", "isAdmin", "address", "contacts"]

    const isValid = updates.every(update => allowedUpdates.includes(update))

    

    if (!isValid) throw new customError("Cannot change some credentials!", 403);

    const oldUser = await User.findById(id);

    updates.forEach(update => {
        oldUser[update] = req.body[update];
    })

    const user = await oldUser.save();
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





module.exports = {
    registerUser,
    loginUser,
    verifyOTP,
    logoutUser,
    updateUser,
    deleteUser,
    getOneUser,
    getAllUser,
    getStatsUser
}