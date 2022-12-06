const router = require("express").Router();
const { findById } = require("../models/User");
const { verifyTokenAndAuthorization }  = require("./verifyToken");

router.put( "/:id", verifyTokenAndAuthorization, async (req, res) => {
        const updates = Object.keys(req.body)
        const allowedUpdates = ["username", "email", "password", "phone"];

        const isValidOperation = updates.every( (update) => allowedUpdates.includes(update))

        if (!isValidOperation ) { return res.status(403).json({error: "Invalid updates credential passed"}) }

        try {
            const user = await findById({ _id: req.params.id })

            updates.forEach( (update) => {
                req.user[update] = user[update];
            })

            await user.save();

            res.status(200).json({user})
        }
        catch (err) {

        }

})

module.exports = router