const User = require("../../models/User");

const { decryptHashedPass, sendOTPverificationEmail } = require("../../utils/utils");
const tryCatch = require("../../utils/tryCatch");
const OTPmodel = require("../../models/OTPverification");
const { JOIuserSchemaValidate } = require("../../middlewares/JoiValidator")
const multer = require("multer");
const customError = require("../../utils/customError");



const registerUser = tryCatch(async (req, res) => {
    // empty body?
    const duplicateUser = User.find({ email: req.body.email } || { username: req.body.username })

    if (duplicateUser.length)
        throw new customError("Duplicate Document Error", 403)

    const {error, value}= await JOIuserSchemaValidate(req.body);
    if (error)  throw new customError(`${error.details[0].message}`, 403);
    

    const user = new User(value);

    await user.save();
    // await sendOTPverificationEmail({id: user._id, email: user.email}, res)
    return res.status(201).json(user);
})




const loginUser = tryCatch(async (req, res) => {
    const cookies = req.cookies;

    if (!req.body.email || !req.body.password) throw new customError("Please fill in the credentials!", 400)
    
    const user = await User.findOne({ email: req.body.email }).exec();

    if (!user) throw new customError("No user found", 404);

    const validPass = await decryptHashedPass({
        password: req.body.password,
        hashedPassword: user.password
    });

    if (!validPass) {
        throw new customError("No user found", 404);
    }


    const newTokenArray = 
        !cookies?.jwt ? user.refreshToken            
        :user.refreshToken.filter(token => token != cookies.jwt);

        
    // create access token
    const tokens = await user.generateAuthToken({rTexpiry: "30d", aTexpiry: "15m"});
    const newRefreshToken = tokens.refreshToken;
    const accessToken = tokens.accessToken;


    if (cookies?.jwt) {
        res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
    }

    user.refreshToken = [...newTokenArray, newRefreshToken]
    await user.save();



    // set refresh token in cookie
    const options = {
        sameSite: "None",
        expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: true
    };

    res.cookie('jwt', newRefreshToken, options);

    user.refreshToken = [...newTokenArray, newRefreshToken]
    await user.save();

    const { refreshToken, password, profile, ...rest } = user._doc;
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
    const userP = await User.findOne({_id: req.params.id})
    userP.profile = req.file.buffer
    const user = await userP.save();
    return res.status(200).json(user);
})





const deleteProfile = tryCatch(async (req, res) => {
    
    const userP = await User.findOne({_id: req.params.id})

    userP.profile = undefined;

    const user = await userP.save();
    return res.status(202).json(user);
})






const getProfile = tryCatch(async (req, res) => {
        const user = await User.findById(req.params.id)
        if (!user || !user.profile) {
            throw new customError("User has no profile", 404)
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