const nodemailer = require("nodemailer")
const OTPmodel = require("../models/OTPverification")
var bcrypt = require('bcryptjs');
const tryCatch = require("./tryCatch");
const customError = require("./customError");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_PASSWORD,
    }
});



const hashPass = async (password) => {
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword;
}


const decryptHashedPass = async ({ password, hashedPassword }) => {
    if (!password || !hashedPassword) {
        return false;
    }
    const passed = await bcrypt.compare(password, hashedPassword)
    return passed;
}


const sendOTPverificationEmail = tryCatch(async ({ userId, email }, res, next) => {
    let OTP = `${Math.floor(1000 + Math.random() * 9000)}`;
    OTP = OTP.toString();
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
    const newOTPverification = new OTPmodel({
        userId,
        email,
        otp: hashedOTP,
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000 // 10 min in milliseconds
    })
    // otp record save in db
    await newOTPverification.save();

    console.log(OTP);

    // send verification mail
    const result = await transporter.sendMail(mailOptions);

    if (!result) return next(undefined, "Email not sent");

    return next(`OTP sent at email: ${email}`)
})


const sendInvoiceEmail = tryCatch(async (req, res) => {

    const inv = req.body.invoice;

    if (!inv) return new customError("No invoice data sent!", 400)

    const pdfBuffer = Buffer.from(inv, 'base64');// Decode base64 data

    // mail options
    const mailOptions = {
        from: process.env.MAIL_EMAIL,
        to: "np03cs4s210142@heraldcollege.edu.np",
        subject: "Invoice",
        html: "Invoice for your order",
        attachments: [{
            filename: 'invoice.pdf',
            content: pdfBuffer.toString('base64'), // Use the decoded PDF data as attachment content
            contentType: 'application/pdf',
            encoding: 'base64' // Specify the encoding type as 'base64'
          }]
    };


    // Send email with attachment
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return next(undefined, "Email not sent");
        } else {
            console.log("Email sent: " + info.response);
            return res.status(200).json("Invoice sent");
        }
    });

})





module.exports = {
    hashPass,
    decryptHashedPass,
    sendOTPverificationEmail,
    sendInvoiceEmail
}