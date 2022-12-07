const User = require("../models/User");

const router = require("express").Router();


const auth = async (req, res, next) => {
  try {
    const accessToken = req.header("Authorization").replace("Bearer ", "")

    const decodedUser = verifyJWT(token);
    const user = await User.findOne({_id: decodedUser._id, "tokens.token": accessToken})


    if (!user) throw new Error("Invalid token")

    req.accessToken = accessToken
    req.user = user

    next()
  }
  catch (err) {
    res.status(500).json(err.message)
  }
}




module.exports = auth;
