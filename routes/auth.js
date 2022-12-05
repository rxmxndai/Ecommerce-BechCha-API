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

// login user

router.post("/login", async (req, res) => {

    try {
        const user = await User.findOne( { email: req.body.email } )

        if (!user) res.status(401).json("No such user registered.")

        const pass = CryptoJS.AES.decrypt(user.password, process.env.CRYPTO_SALT);
        const actualPassword = pass.toString(CryptoJS.enc.Utf8);


        if (actualPassword !== req.body.password) res.status(401).json("No such user registered.")
        
        const { password, ...rest } = user._doc;

        res.status(200).send(rest);

    }
    catch (err) {
        res.status(500).json(err);
    }
})






module.exports = router;