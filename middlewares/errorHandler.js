// custom error handler middleware
const customError = require("../utils/customError");

const errorHandler = async (err, req, res, next) => {

  if (err instanceof customError) {
    return res.status(err.statusCode).json({msg: err.message})
  }


  return res.status(500).send(`Error: ${err.message}`);
};




module.exports = errorHandler