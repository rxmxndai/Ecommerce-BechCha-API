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

    if (!accessToken) return new customError("No access token detected. Login required!", 404)

    try {
        const payload = await JWTverify({ token: accessToken })
        next(null, payload);
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
                next(null, payload);
            });
        }
    }
}

const verifyTokenAndAuthorization = async (req, res, next) => {

    try {
        await verifyToken(req, res, async (err, response) => {
            if (err) throw new customError(err, 401)
            const user = await User.findById( response._id )
            req.user = user;
            if (!user) throw new customError("No user data available!", 401)
            console.log(req.user._id.toString(), "\t", req.params.id);
            if (req.user._id.toString() === req.params.id || req.user.isAdmin) {
                next();
            }
        })
    }
    catch (err) {
        throw new customError(err, 401)
    }
}


const verifyTokenAndAdmin = (req, res, next) => {

    verifyToken(req, res, async (err, response) => {
        
        if (err) {
            return next(err, null);
        }

        const user = await User.findById( response._id )
        req.user = user;

        if (!req.user.isAdmin) {
            return next(new customError("Need administrative privilage!", 403))
        }
        else {
           next();
        }
    
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }