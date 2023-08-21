const nodemailer = require("nodemailer")
const OTPmodel = require("../models/OTPverification")
var bcrypt = require('bcryptjs');
const tryCatch = require("./tryCatch");
const customError = require("./customError");
const { default: intlFormat } = require("date-fns/intlFormat");




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

  // console.log(result);
  if (!result) return next(undefined, "Email not sent");

  return next(`OTP sent at email: ${email}`)
})




// send actual invoice as PDF
const sendInvoiceEmail = tryCatch(async (req, res) => {



  const {order} = req.body;

  const date = new Date(order.createdAt);
  // Extract the date part
  const formattedDate = date.toISOString().split("T")[0];


  // mail options
  const mailOptions = {
    from: process.env.MAIL_EMAIL,
    to: order.email,
    subject: "Invoice",
    html: `
    <!DOCTYPE html>
    <html>
    
    <head>
        <title>Invoice</title>
    </head>
    
    <body style="font-family: Arial, sans-serif; border: 1px solid black;">
    
        <h1 style="padding: 10px; color: gray;"> Thank you for your business with us! </h1>
        <h3 style="padding: 10px; color: gray;"> The order has been delivered. </h3>
    
        <div style="padding: 30px; background-color: #0171b6; color: white;">
            <h1 style="color: {color};">Invoice</h1>
        </div>
    
        <div style="padding: 20px;">
    
            <div style="display: flex; margin-bottom: 15px; font-size: 16px">
                <span style="width: 10%">Recipient</span>
                <span style="">${order.recipient}</span>
            </div>
            <div style="display: flex;  margin-bottom: 15px; font-size: 16px">
                <span style="width: 10%">Ship to</span>
                <span style="">${order.shipping}</span>
            </div>
            <div style="display: flex;  margin-bottom: 15px; font-size: 16px">
                <span style="width: 10%">Date</span>
                <span style=""> ${formattedDate} </span>
            </div>
            <div style="display: flex;  margin-bottom: 15px; font-size: 16px">
                <span style="width: 10%">OrderID</span>
                <span style="">${order._id}</span>
            </div>
    
            <hr style="border: none; height: 1px; margin: 5px; background-color: #0171b6;" />
    
            <h1 style=" color: gray;">Order List</h1>
    
            <div style="margin-top: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="flex: 3; border: 1px solid #000; padding: 8px; text-align: left;">Product</th>
                            <th style="flex: 2; border: 1px solid #000; padding: 8px; text-align: left;">Quantity</th>
                            <th style="flex: 1; border: 1px solid #000; padding: 8px; text-align: left;">Price</th>
                            <th style="flex: 1; border: 1px solid #000; padding: 8px; text-align: left;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                       ${order?.products?.map((prod) => {
                        return (
                          `<tr>
                          <td style="flex: 3; border: 1px solid #000; padding: 8px; text-align: left;">${prod.product.title}</td>
                          <td style="flex: 2; border: 1px solid #000; padding: 8px; text-align: left;">${prod.quantity}</td>
                          <td style="flex: 1; border: 1px solid #000; padding: 8px; text-align: left;">${prod.price}
                          </td>
                          <td style="flex: 1; border: 1px solid #000; padding: 8px; text-align: left;">${prod.price * prod.quantity}
                          </td>
                      </tr>`
                        )
                       })}
                    </tbody>
                </table>
            </div>
            <div style="display: flex;  justify-content: flex-end; margin-top: 50px; font-size: 16px; padding: 5px 0px;">
                <span style="width: 20%">Subtotal</span>
                <span style="">RS ${order.payable}</span>
            </div>
            <div style="display: flex;  justify-content: flex-end; font-size: 16px; padding: 5px 0px;">
                <span style="width: 20%">Tax</span>
                <span style="">13%</span>
            </div>
            <div style="display: flex; justify-content: flex-end;  font-size: 16px; padding: 5px 0px;">
                <span style="width: 20%">Shipping</span>
                <span style="">RS 200</span>
            </div>
            <div style="display: flex; justify-content: flex-end; padding: 5px 0px; font-size: 16px; color: #0171b6;">
                <h3 style="width: 20%">Total</h3>
                <h3 style=""> NPR ${order.payable + Number(200)}</h3>
            </div>
            <hr style="border: none; height: 1px; margin: 10px; background-color: #0171b6;" />
            <div style="margin-top: 20px;">
                <div style="display: flex; justify-content: space-between;">
                    <div style="width: 150px; overflow: hidden;">
                        <img style="width: 120px; object-fit: contain; "
                            src='https://github.com/rxmxndai/rxmxndai-assets/blob/main/assets/Bech_Cha.png?raw=true' />
                    </div>
                </div>
            </div>
    
    
            <h3 style="color: gray;"> Note: You can download the receipt from order details tab on Bech-Cha Online site.
            </h3>
    
        </div>
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
      return next(undefined, "Invoice sent");
    }
  })

})


// send order created email
const sendOrderSuccessfulEmail = tryCatch(async (req, res, next) => {

  const order = req.order

  // const email = req.user.email;
  const email = order.email

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
                    <td> NPR ${order.payable + Number(200)}</td>
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
  const email = order.email

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