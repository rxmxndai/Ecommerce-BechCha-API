const express = require("express");
const mongoose = require("mongoose");

const app = express();
// mongoose.connect(URL)





const PORT = 3000;

app.listen(PORT, () => {
    console.log("Server live at PORT :"+ PORT);
})