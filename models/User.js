const mongoose = require("mongoose");
const { hashPass } = require("../middlewares/utils");
const jwt = require("jsonwebtoken");
const { ref } = require("joi");

const userSchema = new mongoose.Schema( {
        username: {
            type: String, 
            required: true,
            unique: true
        },
        password: {
            type: String, 
            required: true,
        },
        email: {
            type: String, 
            required: true,
            unique: true,
        },
        // phone: {
        //     type: String,
        //     unique: true
        // }, 
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: [String]
    }, 

    { timestamps : true }
);


userSchema.methods.toJSON = function () {
    const user = this

    const userObject = user.toObject()

    delete userObject.password
    delete userObject.refreshToken

    return userObject
}


userSchema.methods.generateAuthToken = async function ( rTexpiry, aTexpiry )  {
    const user = this
    
    if (!user) throw new Error("No user")
    
    const payload = {
        _id: user._id.toString(),
        isAdmin: user.isAdmin,
    }
    
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: rTexpiry});
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: aTexpiry});
    
    user.refreshToken = [...user.refreshToken, refreshToken]
    
    await user.save()
    
    const tokens = {
        refreshToken,
        accessToken
    }

    return tokens
}



userSchema.pre("save", async function (next) {
    const user = this
    if (user.isModified("password")) {
        user.password = await hashPass(user.password)
    }
    next()
} ) 

const User = mongoose.model('User', userSchema);

module.exports = User