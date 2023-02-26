const User = require("../models/User")
const jwt = require("jsonwebtoken");
const customError = require("../utils/customError");



// set refresh token in cookie
const cookieOptions = {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
};



const handleRefreshToken = async (req, res) => {

    const cookies = req.cookies;
    const refreshToken = cookies.jwt;

    if (!refreshToken) {
        return res.status(400).json("No refresh token detected in cookies! please login again.");
    }


    // whether user exist with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()

    // refresh token misuse detected!
    if (!foundUser) {
        console.log("No user found with the current refresh token.");
        jwt.verify(refreshToken, process.env.JWT_SECRET_KEY,
            async (err, payload) => {
                if (err) res.status(403).json("Token not valid! Login again")

                const hackedUser = await User.findOne({ _id: payload._id }).exec();



                hackedUser.refreshToken = [];
                const result = await hackedUser.save();
                console.log(result);
            });
        return new customError("Refresh token cleared!", 200);
    }


    // now we have a valid refresh token which is also present in database
    const newTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken);

    try {
        jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                console.log("Detected expired rf token!");
                foundUser.refreshToken = [...newTokenArray];
                const result = await foundUser.save();
            }
            else if (err || foundUser._id.toString() !== decoded._id) {
                return new customError("Forbidden!", null);
            }

            const payload = {
                _id: decoded._id.toString(),
                isAdmin: decoded.isAdmin
            }
            // get new rt and at
            const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "1d"});
            const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn: "1h"} );

            foundUser.refreshToken = [...newTokenArray, newRefreshToken]
            await foundUser.save();

            // set refresh token in cookie
            res.cookie('jwt', newRefreshToken, cookieOptions);

            return res.status(200).json({ accessToken });
        });
    }
    catch (errr) {
        console.log(errr);
    }
}




module.exports = {
    handleRefreshToken,
    cookieOptions
}


