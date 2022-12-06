const User = require("../models/User");
const router = require("express").Router();
const CryptoJS = require("crypto-js")
const { verifyTokenAndAuthorization }  = require("./verifyToken");
const { findByIdAndDelete } = require("../models/User");

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
            const {password, isAdmin,  ...rest} = updatedUser._doc;

            res.status(201).json( { ...rest } );
        }
        catch (err) {
            res.status(500).json(err)
        }
})


router.delete("/:id", verifyTokenAndAuthorization, async (req, res, next) => {
    try {
        const deletedUser = await User.findByIdAndDelete( req.params.id )
        res.status(200).json({...deletedUser, msg: "User deleted"})
    }
    catch (err) {
        res.status(500).json({err})
    }
})

module.exports = router