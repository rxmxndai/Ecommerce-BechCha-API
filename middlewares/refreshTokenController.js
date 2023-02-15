const User = require("../models/User")
const jwt = require("jsonwebtoken");
const customError = require("../utils/customError");



// set refresh token in cookie
const cookieOptions = {
    sameSite: "None",
    expires: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true
};



const handleRefreshToken = async (req, res, next) => {

    const cookies = req.cookies;
    const refreshToken = cookies.jwt;

    if (!refreshToken) {
        return next(new customError("No refresh token detected in cookies! please login again.", undefined));
    }

    // user exist? with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()

    // if the user with refresh token is not found // must be misuse of refresh token
    if (!foundUser) {
        console.log("No user found with the current refresh token.");
        const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
        const hackedUser = await User.findOne({ _id: payload._id }).exec();

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
}



module.exports = {
    handleRefreshToken,
    cookieOptions
}


