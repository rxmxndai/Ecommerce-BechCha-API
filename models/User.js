const mongoose = require("mongoose");
const { hashPass, signJWT } = require("../middlewares/utils");

const userSchema = new mongoose.Schema( {
        username: {
            type: String, 
            required: true,
            unique: true,
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
        phone: {
            type: Number,
            required: true,
            unique: true,
            validate(value) {
                if (!value > 999999999) 
                throw new Error('Enter 10 digit phone number')
            } 
        }, 
        isAdmin: {
            type: Boolean,
            default: false,
        },
        tokens: [{
            token: {
                type: String,
                required: true
            }
        }],
    }, 

    { timestamps : true }
);


userSchema.methods.toJSON = function () {
    const user = this

    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}


userSchema.methods.generateAuthToken = async function ()  {
    const user = this

    if (!user) throw new Error("No user")

    const payload = {
        _id: user._id.toString()
    }
    const accessToken = signJWT(payload)

    
    user.tokens = user.tokens.concat({ token: accessToken})
    console.log("Token generated: ", user.tokens);
    await user.save()
    return accessToken;
}



userSchema.pre("save", async function (next) {
    const user = this
    if (user.isModified("password")) {
        user.password = hashPass(user.password)
    }
    next()
} ) 

const User = mongoose.model('User', userSchema);

module.exports = User