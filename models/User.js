const mongoose = require("mongoose")
var CryptoJS = require("crypto-js");

const userSchema = new mongoose.Schema( {
        username: {
            type: String, 
            required: true,
            unique: true,
        },
        password: {
            type: String, 
            required: true,
        },
        email: {
            type: String, 
            required: true,
            unique: true,
        },
        phone: {
            type: Number,
            required: true,
            unique: true,
            validate(value) {
                if (value.length > 999999999) 
                throw new Error('Enter 10 digit phone number')
            } 
        }, 
        isAdmin: {
            type: Boolean,
            default: false,
        }
    }, 

    { timestamps : true }
);


const User = mongoose.model('User', userSchema);

module.exports = User