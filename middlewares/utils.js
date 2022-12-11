const CryptoJS = require("crypto-js")
const emailValidator = require("deep-email-validator");
const jwt = require("jsonwebtoken")


const hashPass = (password) => {
    const hashedPassword = CryptoJS.AES.encrypt( password, process.env.CRYPTO_SALT).toString();
    return hashedPassword;
}


const decryptHashedPass = (password) => {
    const pass = CryptoJS.AES.decrypt(password, process.env.CRYPTO_SALT);
    const decryptedPass = pass.toString(CryptoJS.enc.Utf8);
    return decryptedPass;
}


const sendOTPverificationEmail = async () => {
    try {
        const OTP = `${Math.floor(1000 + MATH.RANDOM() * 9000)}`;
        
    }
    catch (err) {

    }
}

async function isEmailValid(email) {
    return await emailValidator.validate( {
      email: email,
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true,
    }
    );
}
  



module.exports = {
    hashPass,
    decryptHashedPass,
    isEmailValid
}