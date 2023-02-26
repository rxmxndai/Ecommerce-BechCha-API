const express = require("express");
const dotenv = require("dotenv")
dotenv.config();
require('./database/mongoose')
require("./middlewares/CloudinarySetup")
const userRoute = require('./routes/users')
const productRoute = require("./routes/products")
const categoryRoute = require("./routes/categories")
const orderRoute = require("./routes/orders")
const errorHandler = require("./middlewares/errorHandler")
const credentials = require("./middlewares/credentials")
var cookieParser = require('cookie-parser')
var cors = require('cors');
const corsOptions = require("./config/corsOptions");


const app = express();

//essentials
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors(corsOptions))

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

//middleware for cookies
app.use(cookieParser());

// built-in middleware for json 
app.use(express.json());



// use routers
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoute);
app.use(errorHandler);




// server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server live at PORT : " + PORT);
})