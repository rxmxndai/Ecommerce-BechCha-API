// custom error handler middleware
const customError = require("../utils/customError");

const errorHandler = async (err, req, res, next) => {

  

  //duplicate key error
  if (err.code === 11000) {
    console.log(err);
    const message = `The value [${(err.keyValue["slug"])}] already exists!`;
    err = new customError(message, 400);
  }


  // custom thrown error
  if (err instanceof customError) {
    return res.status(err.statusCode).json(err.message)
  }


  return res.status(500).send(`Error: ${err.message}`);
};




module.exports = errorHandler