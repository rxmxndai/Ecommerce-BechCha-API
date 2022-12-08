const jwt = require("jsonwebtoken")
const { verifyJWT } = require("./utils")

const verifyToken = (req, res, next ) => {
    const token = req.header('Authorization').replace('Bearer ', '')
    if (token) {
        const decodedUser = verifyJWT(token)

        if (!decodedUser) return res.status(400).json("Not a valid token")
        req.user = decodedUser
        next();
    }
    else {
        return res.status(401).json("Not authenticated !");
    }
}

const verifyTokenAndAuthorization = (req, res, next) => {

    verifyToken(req, res, () => {
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
            res.status(403).json({msg: "Only admin can handle the following request"});
        }
    })
}

module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }