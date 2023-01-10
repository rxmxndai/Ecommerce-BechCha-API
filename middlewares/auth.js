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


    try {
        const payload = await JWTverify({ token: accessToken })
        req.user = payload;
        next(null, "ok");
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            console.log("Access token expired!. Attempt for new token");
            await handleRefreshToken(req, res, async (err, token) => {
                if (err) {
                    return next(err, null);
                }
                console.log("Access token refreshed!");
                const payload = await JWTverify({token: token});
                req.user = payload;
                next(null, payload);
            });
        }
    }
}

const verifyTokenAndAuthorization = async (req, res, next) => {

    await verifyToken(req, res, async (err, response) => {
        if (err) return next(err);

        const user = await User.findOne({ _id: req.user._id })
        req.user = user;

        // console.log(req.user._id, "\t", req.params.id);
        if (req.user._id.toString() === req.params.id || req.user.isAdmin) {
            next();
        }
    })
}


const verifyTokenAndAdmin = (req, res, next) => {

    verifyToken(req, res, async (err, response) => {
        
        if (err) {
            return next(err, null);
        }

        if (req.user.isAdmin) {
            next();
        }
    
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }