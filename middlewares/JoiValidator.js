
const validator = (schema) => (payload) => {
    schema.validate(payload, {abortEarly: false})
} 



var signUpSchema = Joi.object({
    username: Joi.string().min(4).max(15).required(),
    password: Joi.string().min(8).max(15).passwordComplexity().required(),
    email: Joi.string().email().required(),
    phone: Joi.number().integer(),
    isAdmin: Joi.boolean()
})


exports.JoiValidateUserSchema = validator(signUpSchema);