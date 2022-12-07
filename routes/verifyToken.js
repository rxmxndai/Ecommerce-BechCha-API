const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next ) => {
    const token = req.header('Authorization').replace('Bearer ', '')
    if (token) {
        jwt.verify(
            token, 
            process.env.JWT_SECRET_KEY, 
            (err, user) => {
                if (err) return res.status(403).json("Invalid Token !")
                req.user = user;
                next()
            })
    }
    else {
        return res.status(401).json("Not authenticated !");
    }
}

const verifyTokenAndAuthorization = (req, res, next) => {

    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
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