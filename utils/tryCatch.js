const jwt = require("jsonwebtoken");
const { handleRefreshToken } = require("../middlewares/refreshTokenController");

exports.tryCatch = (controller) => async (req, res, next) => {
    try {
        await controller(req, res)
    }
    catch (err) {
        next(err)
    }
}