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


const productSchema = Joi.object({
    name: Joi.string()
    .alphanum()
    .min(4)
    .max(30)
    .required(),
    description: Joi.string().max(300).required,
    img: Joi.binary().required(),
    category: Joi.string().hex().required(),
    

})

const JOIuserSchemaValidate = validator(signUpSchema);
const JOIproductSchemaValidate = validator(productSchema);

module.exports = {
    JOIuserSchemaValidate,
    JOIproductSchemaValidate
}