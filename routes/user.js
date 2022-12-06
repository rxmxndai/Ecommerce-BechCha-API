const User = require("../models/User");
const router = require("express").Router();
const CryptoJS = require("crypto-js")
const { verifyTokenAndAuthorization, verifyTokenAndAdmin }  = require("./verifyToken");

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

        if (!deletedUser) throw new Error("No record found")

        const {...rest} = deletedUser._doc; 
        res.status(200).json({...rest, msg: "User deleted"})
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get particular user
router.get("/find/:id", verifyTokenAndAdmin, async (req, res) =>{
    try {
        const user = await User.findById( req.params.id )

        if (!user) throw new Error("No record found")

        res.status(200).json(user)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )

// get all user
router.get("/", verifyTokenAndAdmin, async (req, res) =>{

    // query
    const query = req.query.new

    try {
        // sort ({parameter: asc or desc})
        // limit => pagination (limit(how many))
        const users = query? await User.find().sort({_id: -1}).limit(1) : await User.find();

        if (!users) throw new Error("No record found")

        res.status(200).json(users)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
} )


// get user stats

router.get("/stats", verifyTokenAndAdmin, async (req, res) =>{
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1 ));

    try {
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

        res.status(200).json( data );
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})


module.exports = router