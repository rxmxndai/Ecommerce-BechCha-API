const router = require("express").Router()
var CryptoJS = require("crypto-js");
const User = require("../models/User")

// register user
router.post("/register", async (req, res) =>  {
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.CRYPTO_SALT).toString(),
    });
    // save to database
    try {
        const savedUser = await newUser.save();
        res.status(201).json( savedUser );
    }
    catch (err) {
        res.status(500).json(err);
    }

});






module.exports = router;