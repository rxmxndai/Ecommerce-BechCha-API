const CryptoJS = require("crypto-js")
const emailValidator = require("deep-email-validator");
const nodemailer = require("nodemailer")
const OTPmodel = require("../models/OTPverification")

const transporter = nodemailer.createTransport({
    service: 'smtp-mail.gmail',
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASSWORD,
    }
});



const hashPass = (password) => {
    const hashedPassword = CryptoJS.AES.encrypt( password, process.env.CRYPTO_SALT).toString();
    return hashedPassword;
}


const decryptHashedPass = (password) => {
    const pass = CryptoJS.AES.decrypt(password, process.env.CRYPTO_SALT);
    const decryptedPass = pass.toString(CryptoJS.enc.Utf8);
    return decryptedPass;
}


const sendOTPverificationEmail = async ({id, email}, res) => {
    

    try {
        const OTP = `${Math.floor(1000 + MATH.RANDOM() * 9000)}`;

        // mail options
        const mailOptions = {
            from: process.env.MAIL_EMAIL,
            to: email,
            subject: "Verify your Email",
            html: `
            <div style="max-width: 90%; margin: auto; padding-top: 20px" >
                <h2>Welcome to the Bech-cha Online.</h2>
                <h4>Enter the OTP : <b> ${OTP} </b> in the app to verify your email address.</h4>
                <p> This code expires in 10 minutes </p>
             </div>
            `,
        };


        // hash the otp
        const hashedOTP = await hashPass(OTP)
        const newOTPverification = await new OTPmodel({

        })
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