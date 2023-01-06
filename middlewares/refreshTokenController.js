const User = require("../models/User")
const jwt = require("jsonwebtoken")

const handleRefreshToken = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json("Refresh token not available") // unauthorized

    const refreshToken = cookies.jwt;
    const foundUser = await User.findOne({ refreshToken }).exec()

    // if the user with refresh token is not found
    if (!foundUser) {
        console.log("No user found with the current refresh token.");
        try {
            const user = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            const hackedUser = await User.findOne({ _id: user._id }).exec();
            hackedUser.refreshToken = [];
            
            const result = await hackedUser.save();
            console.log("User refresh token deleted!");    
            if (cookies.jwt) {
                res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true })
            }
            return res.status(403).json({msg: "Refresh token cleared!"})
        }
        catch (err) {
            return res.status(401).json({msg: "Not the owner of current refresh token!"})
        }
    }

    console.log("User with the refresh token found!");
    // new refresh token arrray without current used refresh token
    const newRefreshTokenArray = await foundUser.refreshToken.filter(token => token !== refreshToken)


    // valid token
    jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, decodedUser) => {

        if (err) {
            foundUser.refreshToken = [...newRefreshTokenArray];
            const result = await foundUser.save()
            console.log(result);
        }
        if (err || foundUser._id.toString() !== decodedUser._id) return res.status(403).json("This refresh token does not belongs to you")

        // refresh token still valid
        const payload = {
            _id: decodedUser._id.toString(),
            isAdmin: decodedUser.isAdmin,
        }
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "10s" });
        const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

        // Saving refreshToken with current user
        foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        try {
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

            return res.status(200).json({ token: accessToken })
        }

        catch (err) {
            return res.status(500).json({"msg": err.message})
        }
    })
}


module.exports = handleRefreshToken
