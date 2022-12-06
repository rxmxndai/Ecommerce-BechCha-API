const router = require("express").Router();
var CryptoJS = require("crypto-js");
const User = require("../models/User");

const emailValidator = require("deep-email-validator");
const jwt = require("jsonwebtoken");

async function isEmailValid(email) {
  return emailValidator.validate(email);
}

// register user
router.post("/register", async (req, res, next) => {
  // empty body?
  if (!req.body.phone || !req.body.username || !req.body.email || !req.body.password) {
    return res.status(400).send("Complete credentials required!");
  }
  
  // new user object with req parameters
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt( req.body.password, process.env.CRYPTO_SALT).toString(),
    phone: req.body.phone,
  });

  // validate email -- no dummy allowed
  const { valid, reason } = await isEmailValid(req.body.email);
  if (!valid) {
    return res.status(400).json({
        message: "Invalid Email detected !",
        reason: reason,
      });    
  }


  try {
    // save to database
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    return res.status(500).json(err.log);
  }
});




// login user

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(404).json("No such user registered.");
    
    const pass = CryptoJS.AES.decrypt(user.password, process.env.CRYPTO_SALT);
    const actualPassword = pass.toString(CryptoJS.enc.Utf8);

    if (actualPassword !== req.body.password) {
      return res.status(404).json("Password milena");
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );
    
    if (!accessToken) throw new Error("No access token created.")
    
    const { password, ...rest } = user._doc;

    res.status(200).send({ ...rest, accessToken });
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
