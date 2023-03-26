const Shipping = require("../models/Shipping");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch")

// ADD addresses for AUTHENTICATED USERS
const addDetails = tryCatch(async (req, res) => {

    const { billingAddress, shippingAddress, recipient, contacts } = req.body;

    if (!billingAddress || !shippingAddress) throw new customError("Address is not definde!", 400);


    if (!recipient || !contacts) throw new customError("UserInfo is not definde!", 400);

    const exists = await Shipping.findOne({user: req.user._id})

    if (exists) {
        return updateDetails(req, res);
    }

    const ShippingData = {
        user: req.user._id,
        billingAddress,
        shippingAddress,
        recipient,
        contacts
    }

    const shippingDetails = new Shipping(ShippingData)

    await shippingDetails.save()

    return res.status(201).json({ shippingDetails });
})



// updates user's address for courier
const updateDetails= tryCatch(async (req, res) => {

    const ship = await Shipping.findOne({ user: req.user._id })

    if (!ship) throw new customError("User do not have address set!", 404)

    const updates = Object.keys(req.body)
    const validUpdates = ["shippingAddress", "billingAddress", "recipient", "contacts"];

    const isValid = updates.every(update => validUpdates.includes(update))

    if (!isValid) throw new customError("Could not change some fields", 500);

    const shippingUpdates = {};

    updates.forEach(update => {
        shippingUpdates[update] = req.body[update];
    });

    const shipping = await Shipping.findOneAndUpdate({ user: req.user._id }, {
        '$set': shippingUpdates
    }, { new: true })

    return res.status(201).json({ shipping });
})



module.exports = {
    addDetails,
    updateDetails
}