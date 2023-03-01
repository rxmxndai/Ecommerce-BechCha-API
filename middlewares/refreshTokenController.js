const User = require("../models/User")
const jwt = require("jsonwebtoken");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch");



// set refresh token in cookie
const cookieOptions = {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: 24 * 60 * 60 * 1000
};



const handleRefreshToken = tryCatch(async (req, res) => {

    const cookies = req.cookies;
    const refreshToken = cookies?.jwt;

    if (!refreshToken) {
        return res.status(500).json({ message: "No refresh token detected in cookies! please login again.", code: "notoken" });
    }


    // whether user exist with this refresh token
    const foundUser = await User.findOne({ refreshToken }).exec()


    // refresh token misuse detected!
    if (!foundUser) {
        console.log("No user found with the current refresh token.");
        jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, payload) => {
            if (err || !payload) return res.status(403).json("Token not valid! Login again")
            const hackedUser = await User.findOne({ _id: payload._id }).exec();
            hackedUser.refreshToken = [];
            const result = await hackedUser.save();
        });

        return res.status(403).json({ message: "No refresh token detected in cookies! please login again.", code: "notoken" });
    }

    // now we have a valid refresh token which is also present in database
    const newTokenArray = foundUser.refreshToken ? foundUser.refreshToken?.filter(rt => rt !== refreshToken) : []

    jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
            console.log("Detected expired rf token!");
            foundUser.refreshToken = [...newTokenArray];
            await foundUser.save();
        }
        else if (err || foundUser._id.toString() !== decoded._id) {
            return next(new customError("Forbidden!", 403));
        }

        const payload = {
            _id: decoded._id.toString(),
            isAdmin: decoded.isAdmin
        }
        // get new rt and at
        const newRefreshToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

        foundUser.refreshToken = [...newTokenArray, newRefreshToken]
        await foundUser.save();

        // set refresh token in cookie
        res.cookie('jwt', newRefreshToken, cookieOptions);

        return res.status(200).json({ accessToken });
    });
}

)




module.exports = {
    handleRefreshToken,
    cookieOptions
}


