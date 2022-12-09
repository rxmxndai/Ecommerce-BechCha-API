const User = require("../models/User")

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json("Refresh token not available") // unauthorized

    const refreshToken = cookies.jwt;
    const foundUser = await User.findOne({refreshToken}).exec()


    // refresh token found but not the correct user
    if (!foundUser) { 
        jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, user) => {

            if (err) return res.status(403).json("This refresh token does not belongs to you") // forbidden

            const hackedUser = await User.findOne({username: user.username}).exec();
            hackedUser.refreshToken = [];
            const result = await hackedUser.save();
            console.log(result);
        })


        return res.status(403).json()
    } 

    // new refresh token arrray without current used refresh token
    const newRefreshTokenArray = foundUser.refreshToken.filter( token => token !== refreshToken )


    // valid token
    jwt.verify(refreshToken, process.env.JWT_SECRET_KEY, async (err, user) => {
        
        if (err) {
            foundUser.refreshToken = [...newRefreshTokenArray];
            const result = await foundUser.save()
        }
        if (err || foundUser.username !== user.username) return res.status(403).json("This refresh token does not belongs to you")

        // refresh token still valid
        const payload = {
            email
        }
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn} );
    })
}
