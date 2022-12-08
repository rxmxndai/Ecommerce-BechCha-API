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


const signJWT = (payload, expiresIn) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {expiresIn} );
    return token
}

const verifyJWT = (token) => {
    try {
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET_KEY)
        return {payload: decodedUser, expired: false};
    }
    catch (err) {
        return {payload: null, expired: error.message.include("jwt expired")}
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
    isEmailValid,
    signJWT,
    verifyJWT
}