const Joi = require("joi")
const passwordComplexity = require("joi-password-complexity");


const validator = (schema) => (payload) =>
    schema.validate(payload, {abortEarly: false})



const signUpSchema = Joi.object({
    username: Joi.string().min(4).max(15).required(),
    password: passwordComplexity().min(8).max(15).required(),
    confirmPassword: Joi.ref("password"),
    email: Joi.string().email().required(),
    phone: Joi.number().integer(),
    isAdmin: Joi.boolean()
})


exports.JoiValidateUserSchema = validator(signUpSchema);