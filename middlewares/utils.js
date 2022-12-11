const CryptoJS = require("crypto-js")
const emailValidator = require("deep-email-validator");
const nodemailer = require("nodemailer")
const OTPmodel = require("../models/OTPverification")

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
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
        let OTP = `${Math.floor(1000 + Math.random() * 9000)}`;
        
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
        console.log(OTP);
        const hashedOTP = hashPass(OTP)
        const newOTPverification =  new OTPmodel({
            userId: id,
            otp: hashedOTP,
            createdAt: Date.now(), 
            expiresAt: Date.now() + 600000 // 10 min in milliseconds
        })
        
        // otp record save in db
        await newOTPverification.save();
        // send verification mail
        const result = await transporter.sendMail(mailOptions);

        
        if (!result) return res.status(500).json({Message: "Could not send email"})
        
       
        return res.status(200).json({
            status: "PENDING",
            MESSAGE: `Verification OTP sent to ${email}`,
            data: {
                userId: id,
                email
            }
        })

    }

    catch (err) {
        return res.status(500).json({
            MESSAGE: err.message,
        })
    }
}


const verifyOTP = async (req, res) => {
    // const user = req.
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
    sendOTPverificationEmail
}