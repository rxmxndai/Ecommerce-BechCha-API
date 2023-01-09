const User = require("../models/User")
const jwt = require("jsonwebtoken")

const handleRefreshToken = async (req, res, next) => {

    const cookies = req.cookies;
    const refreshToken = cookies.jwt;

    // user exist? with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()

    // if the user with refresh token is not found // must be misuse of refresh token
    if (!foundUser) {
        console.log("No user found with the current refresh token.");

        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            const hackedUser = await User.findOne({ _id: payload._id }).exec();
            // delete all authentication
            hackedUser.refreshToken = [];

            await hackedUser.save();
            console.log("User refresh token deleted in database!");
            if (cookies?.jwt) {
                res.clearCookie("jwt", { httpOnly: true, sameSite: "None" })
            }
            console.log("Refresh token cleared in cookies!");
            return res.status(403).json({ msg: "Refresh token cleared!" })
        }
        catch (err) {
            return res.status(401).json({ msg: "Invalid refresh token usage" });
        }
    }
    else {

        // if user with this refresh token is found
        console.log("User with the refresh token found!");


        // new refresh token arrray without current used refresh token
        // deletes the current refreshToken and stores in [newRefreshTokenArray]
        let newRefreshTokenArray = foundUser.refreshToken.length >= 1 ?
            foundUser.refreshToken.filter(token => token !== refreshToken)
            : [];

        // now we have a valid refresh token which is also present in database
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            // generate new accessToken and refreshToken with valid payload
            console.log("aexpired detected");
            const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY);
            const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_KEY);


            // Saving refreshToken with current user in database
            foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];


            const result = await foundUser.save();

            // set refresh token in cookie
            const options = {
                sameSite: "None",
                expires: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                ),
                httpOnly: true,
            };
            res.cookie('jwt', newRefreshToken, options);

            req.user = payload;
            console.log("Token refreshed!");
            next(null, accessToken)
        }
        catch (err) {
            // if jwt not verified
            foundUser.refreshToken = [...newRefreshTokenArray];
            const result = await foundUser.save()
             next(err, null)
        }
    }
}


const handleRefreshTokenAPI = async (req, res, next) => {

    const cookies = req.cookies;
    const refreshToken = cookies.jwt;

    // user exist? with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()

    // if the user with refresh token is not found // must be misuse of refresh token
    if (!foundUser) {
        console.log("No user found with the current refresh token.");

        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            const hackedUser = await User.findOne({ _id: payload._id }).exec();
            // delete all authentication
            hackedUser.refreshToken = [];

            await hackedUser.save();
            console.log("User refresh token deleted in database!");
            if (cookies?.jwt) {
                res.clearCookie("jwt", { httpOnly: true, sameSite: "None" })
            }
            console.log("Refresh token cleared in cookies!");
            return res.status(403).json({ msg: "Refresh token cleared!" })
        }
        catch (err) {
            return res.status(401).json({ msg: "Invalid refresh token usage" });
        }

        
    }
    else {

        // if user with this refresh token is found
        console.log("User with the refresh token found!");


        // new refresh token arrray without current used refresh token
        // deletes the current refreshToken and stores in [newRefreshTokenArray]
        let newRefreshTokenArray = foundUser.refreshToken.length >= 1 ?
            foundUser.refreshToken.filter(token => token !== refreshToken)
            : [];

        // now we have a valid refresh token which is also present in database
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            // generate new accessToken and refreshToken with valid payload
            console.log("aexpired detected");
            const user = await User.findById(payload._id);
            const tokens = await user.generateAuthToken("30d", "10s");

            const newRefreshToken = tokens.refreshToken;
            const accessToken = tokens.accessToken; 

            // set refresh token in cookie
            const options = {
                sameSite: "None",
                expires: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                ),
                httpOnly: true,
            };
            res.cookie('jwt', newRefreshToken, options);

            req.user = payload;
            console.log("Token refreshed!");
            return res.status(200).json({token: accessToken})
        }
        catch (err) {
            // if jwt not verified
            foundUser.refreshToken = [...newRefreshTokenArray];
            const result = await foundUser.save()
             next(err, null)
        }
    }
}



module.exports = {
    handleRefreshToken,
    handleRefreshTokenAPI
}


