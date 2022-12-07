const express = require("express");
const dotenv = require("dotenv")
dotenv.config();
require('./database/mongoose')
const userRoute = require('./routes/user')
const productRoute = require("./routes/product")

const app = express();

app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server live at PORT : " + PORT);
})