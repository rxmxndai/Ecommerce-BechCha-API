const { decryptHashedPass, sendOTPverificationEmail } = require("../utils/utils");
const tryCatch = require("../utils/tryCatch");
const OTPmodel = require("../models/OTPverification");
const { JOIuserSchemaValidate } = require("../middlewares/JoiValidator")
const customError = require("../utils/customError");
const { cookieOptions } = require("../middlewares/refreshTokenController");
const { getDataUri } = require("../utils/dataURI");
const Shipping = require("../models/Shipping");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;



const registerUser = tryCatch(async (req, res) => {
    const file = req?.file;
    const fileURI = file && getDataUri(file);

    const { error, value } = await JOIuserSchemaValidate(req.body);
    if (error) throw new customError(`${error.details[0].message}`, 400);

    const user = new User(value);
    if (file) {

        const myCloud = await cloudinary.uploader.upload(fileURI.content, {
            folder: 'Users',
        })

        user.image = {
            public_id: myCloud.public_id,
            url: myCloud.url,
        }
    }

    await user.save();

    await sendOTPverificationEmail({ userId: user._id, email: user.email }, res, (message, err) => {
        if (err) return res.status(400).json({ message: err })
        else {
            return res.status(201).json({ user, message });
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


    // delete old jwt from db too
    const newTokenArray = !cookies?.jwt ? user.refreshToken : user.refreshToken.filter(token => token != cookies.jwt);

    // create access token
    const tokens = await user.generateAuthToken();
    const newRefreshToken = tokens.refreshToken;
    const accessToken = tokens.accessToken;


    if (cookies?.jwt) {
        res.clearCookie("jwt")
    }

    user.refreshToken = [...newTokenArray, newRefreshToken]
    await user.save();

    res.cookie('jwt', newRefreshToken, cookieOptions);

    // send authorization roles and access token to user
    return res.status(200).json({ user, accessToken });
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
    const user = await User.findOne({ email })
    user.isVerified = true;
    await user.save();
    await OTPmodel.deleteMany({ email });
    return res.status(200).json({
        user,
        message: "User email has been verified"
    })
})


const resendOTP = tryCatch(async (req, res) => {
    let { email } = req.body;

    if (!email) throw new customError("Empty user details!", 400);

    await OTPmodel.deleteMany({ email });

    await sendOTPverificationEmail({ email }, res, (message, err) => {
        if (err) return res.status(400).json({ message: err })
        else {
            return res.status(201).json({ email, message });
        }
    })

})

const logoutUser = tryCatch(async (req, res) => {
    // On client, also delete the accessToken
    const cookies = req.cookies;
    if (!cookies?.jwt) throw new customError("", 204)

    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', cookieOptions);
        throw new customError("No login detected", 400)
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);;
    const result = await foundUser.save();

    res.clearCookie('jwt', cookieOptions);
    return res.status(200).json(result);
})


const updatePass = tryCatch(async (req, res) => {
    let { oldPassword, newPassword, confirmNewPassword } = req.body;

    console.log(oldPassword, newPassword, confirmNewPassword);

    if (confirmNewPassword !== newPassword) throw new customError("Credentials do not match", 400);

    let user = await User.findOne({_id: req.user._id});
    
    if (!user) throw new customError("Invalid request. pLease be authorized!");

    const validPass = await decryptHashedPass({
        password: oldPassword,
        hashedPassword: user.password
    });

    if (!validPass) {
        throw new customError("No user found", 404);
    }

    user.password = newPassword

    user = await user.save();

    return res.status(200).json({message: "Password updated! Please login again."})

})



const updateUser = tryCatch(async (req, res) => {

    const id = req.params.id;
    const updates = Object.keys(req.body);
    const allowedUpdates = ["username", "email", "image", "isAdmin", "address", "contacts"]

    const isValid = updates.every(update => allowedUpdates.includes(update))
    if (!isValid) throw new customError("Cannot change some credentials!", 403);

    const oldUser = await User.findById(id);

    updates.forEach(update => {
        oldUser[update] = req.body[update];
    })

    let user;

    const file = req?.file;
    if (file) {
        try {
            const fileURI = file && getDataUri(file);
            const myCloud = await cloudinary.uploader.upload(fileURI.content, {
                folder: 'Users',
            })
            // Destroy the previous image if it exists
            if (oldUser.image && oldUser.image.public_id) {
                await cloudinary.uploader.destroy(oldUser.image.public_id);
            }

            oldUser.image = {
                public_id: myCloud.public_id,
                url: myCloud.url,
            }
            // Save the updates to the database
            user = await oldUser.save();
        }
        catch (er) {
            console.log(er);
        }
    } else {
        // Save the updates to the database if no file was uploaded
        user = await oldUser.save();
    }

    

    return res.status(201).json(user);
})



const deleteUser = tryCatch(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id)

    if (deletedUser.image && deletedUser.image.public_id) {
        await cloudinary.uploader.destroy(deletedUser.image.public_id)
    }

    if (!deletedUser) throw new customError("No USER record found", 404)

    return res.status(200).json(deletedUser)
})


const getOneUser = tryCatch(async (req, res) => {
    const user = await User.findById(req.params.id).populate(["shipping"])

    if (!user) throw new customError("No USER record found", 404)

    return res.status(200).json(user)
})





const getAllUser = tryCatch(async (req, res) => {

    // query
    const query = req.query.new

    // sort ({parameter: asc or desc})
    // limit => pagination (limit(how many))
    const getFields = {_id: 1, username: 1, image: 1, email: 1, contacts: 1, isVerified: 1  };

    const users = query ? 
        await User.find({}, getFields).sort({ createdAt: -1 }).limit(5) 
        : await User.find({}, getFields).sort({ createdAt: 1 });

    if (!users) throw new customError("No USER record found", 404)

    return res.status(200).json(users)
})


const getUsersShippingDetails = tryCatch(async (req, res) => {
    const ship = await Shipping.findOne({user: req.params.id})

    if (!ship) throw new customError("No details", 404);

    return res.status(200).json(ship);
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
    resendOTP,
    logoutUser,
    updateUser,
    updatePass,
    deleteUser,
    getOneUser,
    getAllUser,
    getStatsUser,
    getUsersShippingDetails
}