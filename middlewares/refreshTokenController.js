const User = require("../models/User")
const jwt = require("jsonwebtoken");
const customError = require("../utils/customError");



// set refresh token in cookie
const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None"
};



const handleRefreshToken = async (req, res, next) => {

    const cookies = req.cookies;
    
    if (!cookies) {
        return next("No refresh token detected in cookies! please login again.", null);
    }

    const refreshToken = cookies.jwt;

    // wheather user exist with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()

    // if the user with refresh token is not found 
    // must be misuse of refresh token
    if (!foundUser) {
        console.log("No user found with the current refresh token.");
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
        const hackedUser = await User.findOne({ _id: payload._id }).exec();
        console.log(hackedUser.username);
        if (!hackedUser) return next("The user with this refresh token does not exist", null);
        // delete all authentication
        hackedUser.refreshToken = [];

        await hackedUser.save();
        if (cookies?.jwt) {
            res.clearCookie("jwt", cookieOptions)
        }
        next(new customError("Refresh token cleared!", 200))
    }

    else {

        // if user with this refresh token is found
        console.log("User with the refresh token found!");

        // now we have a valid refresh token which is also present in database
        const newTokenArray = foundUser.refreshToken.filter(rt => rt !== refreshToken);

        try {

            jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, payload) => {

                if (err) {
                    // old one
                    console.log('Expired Refresh Token')
                    foundUser.refreshToken = [...newTokenArray];
                    await foundUser.save();
                }

                else if (err || foundUser._id.toString() !== payload._id) {
                    next("Forbidden!", null);
                }


                // generate new accessToken and refreshToken with valid payload
                console.log("Expired access token detected!");

                console.log(foundUser.username);
                const tokens = await foundUser.generateAuthToken();
                const accessToken = tokens.accessToken;
                const newRefreshToken = tokens.refreshToken;

                foundUser.refreshToken = [...newTokenArray, newRefreshToken]
                await foundUser.save();
                // set refresh token in cookie
                res.cookie('jwt', newRefreshToken, cookieOptions);
                req.user = payload;
                console.log("\nToken refreshed!\n");
                next(null, accessToken)
            });
        }
        catch (errr) {
            console.log(errr);
        }
    }
}



module.exports = {
    handleRefreshToken,
    cookieOptions
}


