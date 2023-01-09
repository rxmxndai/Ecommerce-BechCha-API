
// custom error handler middleware

const errorHandler = (error, req, res, next) => {
  return res.status(500).send(`Error: ${error.message}`);
};

module.exports = errorHandler