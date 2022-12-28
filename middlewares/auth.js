const jwt = require("jsonwebtoken")

const verifyToken = async (req, res, next ) => {
  
  
    const authHeaders =req.headers['authorization']
  
    if (authHeaders) {
        
        const token = authHeaders.split(" ")[1];

        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, payload) => {
            if (err) return res.status(400).json({
                Error: err.message,
                msg: "Not a valid token"})
        
            req.user = payload
            next();
        });

       
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