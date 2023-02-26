const jwt = require("jsonwebtoken");
const User = require("../models/User");
const customError = require("../utils/customError");





const JWTverify =  async ({token}) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY)
    return payload;
}


const verifyToken = async (req, res, next) => {

    const authHeaders = req.headers['authorization']
    let accessToken = authHeaders?.split(" ")[1];

    if (!accessToken) return next(new customError("No access token detected. Login required!", 404))

    try {
        const payload = await JWTverify({ token: accessToken })
        next(null, payload);
    }
    catch (error) {
        next(error, null);
    }
}

const verifyTokenAndAuthorization = async (req, res, next) => {

    try {
        await verifyToken(req, res, async (err, response) => {
            if (err) return new customError(err, 401)
            const user = await User.findById( response._id )
            req.user = user;
            if (!user) return res.status(403).json("No user data available!");
            // console.log(req.user._id.toString(), "\t", req.params.id);
            if (req.user._id.toString() === req.params.id || req.user.isAdmin) {
                next();
            }
        })
    }
    catch (err) {
       return res.status(500).json(err);
    }
}


const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, async (err, response) => {
        if (err) {
            return new customError(err, 403);
        }
        const user = await User.findById( response._id )
        req.user = user;
        if (!req.user?.isAdmin) {
            return res.status(403).json("Need administrative privilage!")
        }
        else {
           next();
        }
    
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }