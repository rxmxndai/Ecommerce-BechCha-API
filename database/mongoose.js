const mongoose = require("mongoose");


mongoose.connect(process.env.MONGOOSE_SECRET_KEY, (err, res) => {
    if (err) { console.log(err) }
    console.log("Database connected Successfully !")
})