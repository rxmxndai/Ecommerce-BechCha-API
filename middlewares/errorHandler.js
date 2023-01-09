// custom error handler middleware
const customError = require("../utils/customError");

const errorHandler = async (error, req, res, next) => {

  if (error instanceof customError) {
    console.log("Error Handler Invoked!");
    return res.status(error.statusCode).json({msg: error.message})
  }


  console.log("sadasdad");
  return res.status(500).send(`Error: ${error.message}`);
};

module.exports = errorHandler