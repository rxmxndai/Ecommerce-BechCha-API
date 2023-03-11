const mongoose = require("mongoose");


mongoose.connect(process.env.MONGOOSE_SECRET_KEY)
    .then(() => {
        console.log("Database connected Successfully !");
    })
    .catch((err) => {
        console.log(err);
    });