const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv")
const userRoute = require('./routes/user')

const app = express();

dotenv.config();

mongooseKey = process.env.MONGOOSE_SECRET_KEY;

mongoose.connect(mongooseKey)
.then(console.log("Database connected Successfully !"))
.catch( err => console.log(err))



app.use("/api/user", userRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server live at PORT :" + PORT);
})