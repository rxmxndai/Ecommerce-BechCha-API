const Joi = require("joi");

const validator = (schema) => (payload) => {
        return schema.validate(payload, { allowUnknown: true })
}




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
        title: Joi.string()
                .min(4).max(50)
                .required(),
        description: Joi.string()
                .max(1000)
                .allow(''),
        images: Joi.array().items(Joi.binary().required()),
        category: Joi.string()
                .hex()
                .required(),
        specification: Joi.object()
                .pattern(Joi.string(), Joi.array()),
        price: Joi.number()
                .min(0).max(1000000)
                .required(),
})







const JOIuserSchemaValidate = validator(signUpSchema);
const JOIproductSchemaValidate = validator(productSchema);



module.exports = {
        JOIuserSchemaValidate,
        JOIproductSchemaValidate
}