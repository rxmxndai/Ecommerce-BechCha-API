const Address = require("../models/Address");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch")

// ADD addresses for AUTHENTICATED USERS
const addAddress = tryCatch(async (req, res) => {
    const { billingAddress, shippingAddress } = req.body;

    if (!billingAddress || !shippingAddress) throw new customError("Address is not definde!", 400);

    const addressData = new Address({
        user: req.user._id,
        billingAddress,
        shippingAddress
    })

    await addressData.save();

    return res.status(201).json({ address: addressData });
})



// updates user's address for courier
const updateAddress = tryCatch(async (req, res) => {

    const address = await Address.findOne({ user: req.user._id })

    if (!address) throw new customError("User do not have address set!", 404)

    const updates = Object.keys(req.body)
    const validUpdates = ["shippingAddress", "billingAddress"];

    const isValid = updates.every(update => validUpdates.includes(update))

    if (!isValid) throw new customError("Could not change some fields", 500);

    const addressUpdates = {};
    updates.forEach(update => {
        addressUpdates[update] = req.body[update];
    });


    const userAddress = await Address.findOneAndUpdate({ user: req.user._id }, {
        '$set': addressUpdates
    }, { new: true })

    return res.status(201).json({ userAddress });
})



module.exports = {
    addAddress,
    updateAddress
}