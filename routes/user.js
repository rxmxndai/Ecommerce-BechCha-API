const User = require("../models/User");
const router = require("express").Router();
const CryptoJS = require("crypto-js")
const { verifyTokenAndAuthorization }  = require("./verifyToken");

router.put( "/:id", verifyTokenAndAuthorization, async (req, res) => {
        if (req.body.password) {
            req.body.password = CryptoJS.AES.encrypt(req.body.password , process.env.CRYPTO_SALT).toString();
        }
        
        try {
            const updatedUser = await User.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )  
            
            res.status(201).json(updatedUser);
        }
        catch (err) {
            res.status(500).json(err)
        }

})

module.exports = router