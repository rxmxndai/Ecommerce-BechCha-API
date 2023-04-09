const nodemailer = require("nodemailer")
const OTPmodel = require("../models/OTPverification")
var bcrypt = require('bcryptjs');
const tryCatch = require("./tryCatch");
const customError = require("./customError");




// nodemailer transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "gmail",
    auth: {
        user: process.env.MAIL_EMAIL,
        pass: process.env.MAIL_PASSWORD,
    }
});


// hash the password before saving
const hashPass = async (password) => {
    const hashedPassword = await bcrypt.hash(password, 10)
    return hashedPassword;
}

/// decrypt the hashed pass
const decryptHashedPass = async ({ password, hashedPassword }) => {
    if (!password || !hashedPassword) {
        return false;
    }
    const passed = await bcrypt.compare(password, hashedPassword)
    return passed;
}




// send otp for user verificatioon or resend
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




// send actual invoice as PDF
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


// send order created email
const sendOrderSuccessfulEmail = tryCatch(async (req, res, next) => {

    const order = req.order
    // const email = req.user.email;
    const email = "eivorx123@gmail.com";

    // mail options
    const mailOptions = {
        from: process.env.MAIL_EMAIL,
        to: email,
        subject: "Bech-Cha Order Successful!",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Confirmation Email Bech-Cha </title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 90%;
                    margin: auto;
                    padding-top: 20px;
                }
                h2 {
                    color: #007bff;
                }
                h4 {
                    margin-top: 0;
                }
                p {
                    margin-bottom: 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                img {
                    width: 100px;
                    margin: 10px 0px;
                }
            </style>
        </head>
        <body>
            <h2>Order Confirmation</h2>
            <p>Dear Customer,</p>
            <p>Your order has been successfully placed with Bech-cha Online. Please find the details of your order below:</p>
            <table>
                <tr>
                    <th>Order ID:</th>
                    <td>${order._id}</td>
                </tr>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                </tr>
                ${order.products.map((product) => {
            return `
                    <tr>
                        <td>${product.product}</td>
                        <td>${product.quantity}</td>
                        <td>${product.price}</td>
                    </tr>`
        })}

                <tr>
                    <th>Total Amount:</th>
                    <td> NPR ${order.payable}</td>
                </tr>
            </table>
            <p>Your order will be delivered within 3 days from the date of checkout. </p>
            <p> <b> NOTE: </b> VAT and Delivery fare to be included on receipt. </p>
            <p>Thank you for shopping with us!</p>
            <img src='https://github.com/rxmxndai/rxmxndai-assets/blob/main/assets/Bech_Cha.png?raw=true' />
        </body>
        </html>
            `,
    };

    // Send email with attachment
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return next("Email not sent", undefined);
        } else {
            console.log("Email sent: " + info.response);
            return next(undefined, "Invoice sent");
        }
    })
})







const sendOrderCancellation = tryCatch(async (req, res, next) => {
    const order = req.order
    const email = "eivorx123@gmail.com";

    // mail options
    const mailOptions = {
        from: process.env.MAIL_EMAIL,
        to: email,
        subject: "Order Cancelled Notice",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cancelled Order Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            h2 {
              color: #f00;
            }
            img {
                width: 100px;
                margin: 10px 0px;
            }
          </style>
        </head>
        <body>
          <h2>Order Cancelled </h2>
          <table>
            <tr>
              <th>Order ID:</th>
              <td>${order._id}</td>
            </tr>
            <tr>
              <th>Order Status:</th>
              <td>Cancelled</td>
            </tr>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
            </tr>
            <tbody>
              ${order.products.map(({ product, price, quantity }) => {
            return `
                  <tr>
                    <td>${product}</td>
                    <td>${price}</td>
                    <td>${quantity}</td>
                  </tr>
                `;
        })}
            </tbody>
            <tr>
              <th>Total Amount:</th>
              <td colspan="2">NPR ${order.payable}</td>
            </tr>
            <tr>
              <th>Order Status:</th>
              <td colspan="2">Cancelled</td>
            </tr>
          </table>

          <p>We apologize for any inconvinience. </p>
          <p>Thank you for choosing us!</p>
          <img src='https://github.com/rxmxndai/rxmxndai-assets/blob/main/assets/Bech_Cha.png?raw=true' />
        </body>
        </html>
        
        `

    };

   // Send email with attachment
   transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error(error);
        return next("Email not sent", undefined);
    } else {
        console.log("Email sent: " + info.response);
        return next(undefined, "Cancellation email sent");
    }
})
})

module.exports = {
    hashPass,
    decryptHashedPass,
    sendOTPverificationEmail,
    sendInvoiceEmail,
    sendOrderSuccessfulEmail,
    sendOrderCancellation
}