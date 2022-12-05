const router = require("express").Router()
var CryptoJS = require("crypto-js");
const User = require("../models/User")

const emailValidator = require('deep-email-validator');
const jwt = require('jsonwebtoken')

async function isEmailValid(email) {
    return emailValidator.validate(email)
}

// register user
router.post("/register", async (req, res) =>  {
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.CRYPTO_SALT).toString(),
    });

    const {valid, validators, reason} = await isEmailValid(req.body.email)

    if (!valid)  {
        res.status(400).json({
            message: "Invalid Email detected !",
            reason: validators[reason].reason
        });
    }

    // save to database
    try {
        const savedUser = await newUser.save();
        res.status(201).json( savedUser );
    }
    catch (err) {
        res.status(500).json(err);
    }

});

// login user

router.post("/login", async (req, res) => {

    try {
        const user = await User.findOne( { email: req.body.email } )

        if (!user) res.status(401).json("No such user registered.")

        const pass = CryptoJS.AES.decrypt(user.password, process.env.CRYPTO_SALT);
        const actualPassword = pass.toString(CryptoJS.enc.Utf8);

        if (actualPassword !== req.body.password) res.status(401).json("No such user registered.")
        
        const accessToken = jwt.sign({
            id: user._id,
            isAdmin: user.isAdmin,
            }, 
            process.env.JWT_SECRET_KEY,
            {expiresIn: "1d"}    
        );

        const { password, ...rest } = user._doc;

        res.status(200).send( {...rest, accessToken} );

    }
    catch (err) {
        res.status(500).json(err);
    }
})






module.exports = router;