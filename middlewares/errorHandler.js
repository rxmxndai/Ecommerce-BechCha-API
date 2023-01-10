// custom error handler middleware
const customError = require("../utils/customError");
const Joi = require("joi")

const errorHandler = async (err, req, res, next) => {

  //duplicate key error
  if (err.code === 11000) {
    const message = `The value [${(err.keyValue["slug"])}] already exists!`;
    err = new customError(message, 400);
  }

  else if (err.name === "ValidationError")  {
    const message = `${err.message}`;
    err = new customError(message, 400);
  }

  // custom thrown error
  if (err instanceof customError) {
    return res.status(err.statusCode).json(err.message)
  }


  return res.status(500).send(`Error: ${err.message}`);
};




module.exports = errorHandler