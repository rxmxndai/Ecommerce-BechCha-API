const router = require("express").Router();
const User = require("../models/User");
const { verifyTokenAndAuthorization, verifyTokenAndAdmin }  = require("../middlewares/auth");
const { decryptHashedPass, sendOTPverificationEmail } = require("../middlewares/utils");





// register user
router.post("/register", async (req, res) => {
    // empty body?
    if (!req.body.phone || !req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).send("Complete credentials required!");
    }

    const duplicateUser = User.find({email: req.body.email})

    if (duplicateUser.length) 
        return res.status(409).json({msg: `User with same email exists already. ${duplicateUser}`})
    
    const user = new User(req.body)

    await sendOTPverificationEmail({id: user._id, email: user.email}, res)
    

    try {
        
        // save to database  
        await user.save();

      res.status(201).json( user );

    } catch (err) {
      return res.status(500).json(err.log);
    }
  });


  // verify OTP
  router.post("/verifyOTP", async (req, res) => {
    try {
        let { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(500).json({msg: "Empty OTP entered"})
        }

        const userOTPrecords = await OTPve

    }

    catch (err) {
        res.status(500).json({msg: "OTP  mismatch"})
    }
  })



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



  router.delete("/logout", verifyTokenAndAuthorization, async (req, res) => {
         // On client, also delete the accessToken

    const cookies = req.cookies;
    // console.log(cookies.jwt);
    if (!cookies?.jwt) return res.sendStatus(204); //No content

    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();
    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);;
    const result = await foundUser.save();

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.status(200).json(foundUser);
  })

  
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