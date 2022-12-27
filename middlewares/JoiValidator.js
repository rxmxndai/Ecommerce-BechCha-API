const Joi = require("joi")

const validator = (schema) => (payload) =>
    schema.validate(payload)

    // {abortEarly: false}, {allowUnknown: true}

const signUpSchema = Joi.object({
    username: Joi.string()
            .alphanum()
            .min(4)
            .max(30)
            .required(),
    password: Joi.string()
            .min(4)
            .max(10)
            .required(),
    confirmPassword: Joi.ref('password'),
    email: Joi.string()
            .required()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).lowercase(),
    phone: Joi.number(),
    isAdmin: Joi.boolean()
})

const JOIuserSchemaValidate = validator(signUpSchema);

module.exports = {
    JOIuserSchemaValidate
}