const jwt = require("jsonwebtoken");
// const handleRefreshToken = require("./refreshTokenController");
const axios = require("axios");
const handleRefreshToken = require("./refreshTokenController");



const verifyToken = async (req, res, next) => {

    const authHeaders = req.headers['authorization']
    let accessToken = authHeaders?.split(" ")[1];

    const cookies = req.cookies;

    if (accessToken && cookies?.jwt) {
        try {
            const payload = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
            req.user = payload;
            next();
        }
        catch (err) {

            if (err instanceof jwt.TokenExpiredError) {
                console.log("Access token expired!. Attempt for new token");
                await handleRefreshToken(req, res, (err, token) => {
                    if (err) {
                        throw new Error(err);
                    }
                    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
                    req.user = payload;
                    next();
                });
            }
            else {
                return res.status(401).json({
                    err,
                    msg: "No Valid Authorization headers were found! [ACCESS TOKEN ERROR]"
                })
            }
        }
    }
    else {
        return res.status(401).json("Not authenticated !");
    }
}

const verifyTokenAndAuthorization = (req, res, next) => {

    verifyToken(req, res, () => {
        console.log(req.params.id);
        if (req.user._id === req.params.id || req.user.isAdmin) {
            next();
        }
        else {
            return res.status(403).json("Not Allowed")
        }

    })
}


const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        }
        else {
            res.status(403).json({ msg: "Only admin can handle the following request" });
        }
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }