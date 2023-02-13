const express = require("express");
const dotenv = require("dotenv")
dotenv.config();
require('./database/mongoose')
require("./middlewares/CloudinarySetup")
const userRoute = require('./routes/users')
const productRoute = require("./routes/products")
const categoryRoute = require("./routes/categories")
const errorHandler = require("./middlewares/errorHandler")

var cookieParser = require('cookie-parser')
var cors = require('cors')


const app = express();

//essentials
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: true,
  }))
app.use(express.json());


// use routers
app.use("/api/users", userRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/products", productRoute);
app.use( errorHandler);




// server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server live at PORT : " + PORT);
})