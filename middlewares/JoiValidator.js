const Joi = require("joi")

const validator = (schema) => (payload) =>
    schema.validate(payload, {abortEarly: false})



const signUpSchema = Joi.object({
    username: Joi.string().min(4).max(15).required(),
    password: Joi.string().min(8).max(15).required(),
    confirmPassword: Joi.ref("password"),
    email: Joi.string().email().required(),
    phone: Joi.number(),
    isAdmin: Joi.boolean()
})


exports.JoiValidateUserSchema = validator(signUpSchema);