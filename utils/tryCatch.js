// exports.tryCatch = (controller) => async (req, res, next) => {
//     try {
//         await controller(req, res)
//     }
//     catch (err) {
//         next(err)
//     }
// }


module.exports = (theFunc) => async(req, res, next) => {
    Promise
        .resolve(theFunc(req, res, next))
        .catch(next);
};