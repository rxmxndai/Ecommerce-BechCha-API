const router = require("express").Router();
const User = require("../models/User");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin }  = require("../middlewares/auth");
const { isEmailValid, decryptHashedPass, verifyJWT } = require("../middlewares/utils");
const { findOneAndUpdate } = require("../models/User");


// register user
router.post("/register", async (req, res) => {
    // empty body?
    if (!req.body.phone || !req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).send("Complete credentials required!");
    }
  
    // // validate email -- no dummy allowed
    // const { valid, reason } = await isEmailValid(req.body.email);
    // if (valid === false) {
    //   return res.status(400).json({
    //       message: "Invalid Email detected !",
    //       reason: reason,
    //     });    
    // }

    try {
        const user = new User(req.body)
        // save to database  
        await user.save();

      res.status(201).json( user );

    } catch (err) {
      return res.status(500).json(err.log);
    }
  });





  // login user
router.post("/login", async (req, res) => {
    const cookies = req.cookies;

    try {

      const user = await User.findOne({ email: req.body.email }).exec();
  
      if (!user) return res.status(401).json("No such user registered."); // unauthorized

      const actualPassword = decryptHashedPass(user.password);
       
      if (actualPassword !== req.body.password) {
        return res.status(401).json("No such user registered.");
      }
    
      // create access token
      const tokens = await user.generateAuthToken("1d", "60s");
      const newRefreshToken = tokens.refreshToken;
      const accessToken = tokens.accessToken;
      
      
      let newRefreshTokenArray = cookies?.jwt ? 
        user.refreshToken.filter( token => token !== cookies.jwt)
        : user.refreshToken
      
      

        if (cookies?.jwt) {
            const refreshToken = cookies.jwt;
            const foundToken = await User.findOne({refreshToken}).exec()

            // if detected reuse of refresh token
            if (!foundToken) {
                console.log("Attempted refresh token reuse at login");
                newRefreshTokenArray = [];
            }
            res.clearCookie("jwt", {httpOnly: true, sameSite: "None", secure: true})
        }

        // Saving refreshToken with current user
        user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await user.save();
        // set accesss token in cookie

        res.cookie("jwt", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 24*60*60*1000
        })

        console.log("Login Successful");
        const {refreshToken, password, ...rest} = user._doc;
        // send authorization roles and access token to user
      res.status(200).json( { ...rest, accessToken } );


    } catch (err) {
      return res.status(500).json(err);
    }
  });



  
// update user
router.put( "/:id", verifyTokenAndAuthorization, async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate( 
                req.params.id, 
                {
                    $set: req.body,
                },
                { new: true }
            )  

            res.status(201).json( user );
        }
        catch (err) {
            res.status(500).json(err)
        }
})


router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
    
    try {
        const deletedUser = await User.findByIdAndDelete( req.user._id )

        if (!deletedUser) throw new Error("No record found")

        res.status(200).json(deletedUser)
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
router.get("/find", verifyTokenAndAdmin, async (req, res) =>{

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