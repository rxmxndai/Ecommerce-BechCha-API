const jwt = require("jsonwebtoken");
const handleRefreshToken = require("./refreshTokenController");



const JWTverify = ({token}) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return payload;
}

const verifyToken = async (req, res, next ) => {
  
  
    const authHeaders =req.headers['authorization']
  
    if (authHeaders) {
        const token = authHeaders.split(" ")[1];

        try {
            req.user = JWTverify();
            next();
        } 
        catch (err ) {
            if (err instanceof jwt.TokenExpiredError) {
                try {
                    token = handleRefreshToken();
                    req.user = JWTverify();
                    next();
                }
                catch (err1) {
                    return res.status(401).json({msg: "RFRESH TOKEN ERROR"})
                } 
            }
            else {
                return res.status(401).json({msg: "No Authorization headers were found!"})
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
            res.status(403).json({msg: "Only admin can handle the following request"});
        }
    })
}


module.exports = { verifyToken, verifyTokenAndAdmin, verifyTokenAndAuthorization }