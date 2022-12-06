const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next ) => {
    const authHeader = req.header.token

    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(
            token, 
            process.env.JWT_SECRET_KEY, 
            (err, res) => {
                if (err) return res.status(403).json("Invalid Token !")
                req.user = res
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
        
        return res.status(403).json("Not Allowed")

    }) 
}

module.exports = { verifyToken, verifyTokenAndAuthorization }