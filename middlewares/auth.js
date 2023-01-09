const jwt = require("jsonwebtoken");
const User = require("../models/User");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch");
const { handleRefreshToken } = require("./refreshTokenController");





const JWTverify =  async ({token}) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
    return payload;
}


const verifyToken = async (req, res, next) => {

    const authHeaders = req.headers['authorization']
    let accessToken = authHeaders?.split(" ")[1];

    const cookies = req.cookies;
    const refreshToken = cookies.jwt;


    try {
        if (refreshToken === undefined) {
            return next(new customError("No refresh token detected in cookies! please login again." , 400));
        }
        const payload = await JWTverify({ token: accessToken })
        console.log("hahaahahhahhahahaaaaaaaaaaa");
        req.user = payload;
        console.log(req.user._id);
        next();
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            console.log("Access token expired!. Attempt for new token");
            await handleRefreshToken(req, res, async (err, token) => {
                if (err) {
                    return res.status(401).json(err.message);
                }
                const payload = await JWTverify({token: token});
                req.user = payload;
                next();
            });
        }

        return next(new customError(error , 400));
    }
}

const verifyTokenAndAuthorization = async (req, res, next) => {

    await verifyToken(req, res, async (err, response) => {

        if (err) return next(new customError(err , 400));

        const user = await User.findOne({ _id: req.user._id })
        req.user = user;

        if (req.user._id.toString() === req.params.id || req.user.isAdmin) {
            next();
        }
    })
}


const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        }
        else {
            return res.status(403).json({ msg: "Only admin can handle the following request" });
        }
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }