const Order = require("../models/Order");
const Product = require("../models/Product");
const tryCatch = require("../utils/tryCatch");
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
const customError = require("../utils/customError");
const User = require("../models/User");
const { sendInvoiceEmail, sendOrderSuccessfulEmail, sendOrderCancellation } = require("../utils/utils");



const now = new Date();
const lastMonthStartDate = startOfMonth(subMonths(now, 1));
const lastMonthEndDate = endOfMonth(subMonths(now, 1));
const currentMonthStartDate = startOfMonth(now);
const currentMonthEndDate = endOfMonth(now);

const DifferenceInPerc = (a, b) => {
    return result = [(a - b) / b] * 100;
}


// invoice send
const sendInvoiceOfOrder = tryCatch(async (req, res) => {

    await sendInvoiceEmail(req, res, (err, message) => {
        if (err) return res.status(400).json({ message: err })
        else {
            return res.status(200).json({ message });
        }
    })
})





/// add or place an order
const addOrder = tryCatch(async (req, res) => {

    const { products, payable, totalItems, isPaid, paymentType } = req.body;

    // find the user who requested
    const user = await User.findOne({_id : req.user._id}).populate({ path: 'shipping' })


    if (!products || products.length <= 0 || !payable || !totalItems || !paymentType ) {
        throw new customError("Order details insufficient. Provide all details.", 400);
    }

    const values = {
        user: req.user._id,
        payable,
        email: user.email,
        totalItems,
        products,
        recipient: user.shipping.recipient,
        shipping: user.shipping.shippingAddress,
        billing: user.shipping.billingAddress,
        isPaid: isPaid === true ? true : false,
        paymentType
    };

    const order = await new Order(values).save();

    if (!order) throw new customError("Order info insufficient!", 400);

    req.order = order

    await sendOrderSuccessfulEmail(req, res, (err, payload) => {
        if (err) {
            throw new customError({message: err})
        }

        else {
            return res.status(201).json({order, message: payload});
        }
    
    })

    
})



// cancel order
const cancelOrder = tryCatch(async (req, res) => {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) throw new customError("No order found!", 404);



    if (order.status !== "pending") return res.status(400).json("Order cannot be cancelled now.")


    order.status = "cancelled";
    const ord = await order.save();

    req.order = ord
    await sendOrderCancellation(req, res, (err, payload) => {
        if (err) {
            throw new customError({message: err})
        }

        else {
            return res.status(200).json({order, message: payload});
        }
    })

})



// update order
const updateOrder = tryCatch(async (req, res) => {
    const orderId = req.params.id;
    const {status} = req.body;

    if (!status) throw new customError("Invalid status!", 400);

    const order = await Order.findById(orderId).populate(["products.product", "user"]);

    if (!order) throw new customError("No order found!", 404);

    if (status === "delivered") {
        order.status = status;
        order.isPaid = true;
        order.paymentType = "Cash-on-delivery"
        await order.save();
        
        // send invoice email for successful delivered
        req.body.order = order

        await sendInvoiceEmail(req, res);

        // decrement product's stock and incremnet sold items
        const productsArray = order.products;
        for (let update of productsArray) {
            await Product.updateOne(
                { _id: update.product },
                {
                    "$inc": {
                        quantity: -update.quantity,
                        sold: +update.quantity,
                    },
                }
            )
        }

        return res.status(200).json(`Order updated to ${order.status}`)
    }

    order.status = status;
    await order.save();
    return res.status(200).json(`Order updated to ${order.status}`)
})



// delete one order can be done by admin only
const deleteOrder = tryCatch(async (req, res, next) => {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id)

    if (!deletedOrder) throw new Error("No record found")


    const { ...products } = deletedOrder._doc;

    console.log("Deleted!");

    return res.status(200).json({ ...products, msg: "Order deleted" })

})



// get One user's orderList
const getUserOrders = tryCatch(async (req, res) => {

    const orderId = req.params.id;

    const orders = await Order.find({ user: orderId }, null, { sort: { createdAt: -1 } }).populate([{
        path: "user",
        select: ["username",  "image"]
    },
    {
        path: "products.product",
        select: ["title", "_id", "images"]
    }
])
    if (!orders) return res.status(200).json([])

    return res.status(200).json(orders)

})



// returns details of one order
const getOneOrderById = tryCatch(async (req, res) => {

    const orderId = req.params.id;
    const userId = req.user._id;
    const isAdmin = req.user?.isAdmin;

    let order;

    if (isAdmin) {
        order = await Order.findOne({ _id: orderId }).populate(["user", "products.product"])
    }
    else {
        order = await Order.findOne({ _id: orderId, user: userId }).populate(["user", "products.product"])
    }

    if (!order) return res.status(200).json([])

    return res.status(200).json(order)

})



/// GET ALL ORDERS FFROM DB
const getAllOrders = tryCatch(async (req, res) => {
    const queryLimit = parseInt(req.query?.limit)
    let options = {}, queries = {};
    if (queryLimit) {
        options.limit = queryLimit
    }

    options.sort = { createdAt: -1 };

    const populateOptions = [
        { path: 'user', select: '_id username image' },
        { path: 'products.product', select: '_id title price images' }
    ];

    const orders = await Order.find(queries, null, options).populate(populateOptions);
    return res.status(200).json(orders)
})



//Analytics and stats of orders past month to now
const getSalesAnalytics = tryCatch(async (req, res) => {
    const SalesLastMonth = await Order.find({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
        status: "delivered",
    });
    if (!SalesLastMonth) throw new customError("No sales last month", 404);

    const SalesThisMonth = await Order.find({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate },
        status: "delivered",
    });

    if (!SalesThisMonth) throw new customError("No sales this month", 404);

    // console.log("Last: ", SalesLastMonth, "\nThis: ", SalesThisMonth);

    const totalSalesThisMonth = SalesThisMonth?.reduce((totalSales, order) => totalSales + order.payable, 0);
    const totalSalesLastMonth = SalesLastMonth?.reduce((totalSales, order) => totalSales + order.payable, 0);
    const result = DifferenceInPerc(totalSalesThisMonth, totalSalesLastMonth);


    // console.log(result, totalSalesLastMonth, totalSalesThisMonth);

    return res.status(200).json({ result, totalSalesLastMonth, totalSalesThisMonth })
})




const getOrdersAnalytics = tryCatch(async (req, res) => {

    // all orders created last nmonth OnlyCount
    const LastMonthCount = await Order.countDocuments({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate }
    });

    // all orders created this nmonth OnlyCount
    const ThisMonthCount = await Order.countDocuments({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate }
    });


    // percentage for orders created difference
    const orderCountDifference = DifferenceInPerc(ThisMonthCount, LastMonthCount);


    // orders document list which is paid and last month
    let ordersBefore = await Order.find({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
    });
    const orderAmountPrev = ordersBefore.reduce((value, ord) => {
        return value + ord.payable;
    }, 0)


    // orders document list which is paid and this month
    let ordersThis = await Order.find({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate },
    });
    const orderAmountNow = ordersThis.reduce((value, ord) => {
        return value + ord.payable;
    }, 0)

    const orderAmountDifference = DifferenceInPerc(orderAmountNow, orderAmountPrev);

    return res.status(200).json({
        orderCountDifference,
        ThisMonthCount,
        LastMonthCount,
        orderAmountNow,
        orderAmountPrev,
        orderAmountDifference
    })
})


const getUserPercentage = tryCatch(async (req, res) => {
    const LastMonthCount = await User.countDocuments({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate }
    });

    const ThisMonthCount = await User.countDocuments({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate }
    });

    const userCountDifference = DifferenceInPerc(ThisMonthCount, LastMonthCount);

    return res.status(200).json({ LastMonthCount, ThisMonthCount, userCountDifference })
})

module.exports = {
    addOrder,
    cancelOrder,
    updateOrder,
    deleteOrder,
    getUserOrders,
    getOneOrderById,
    getAllOrders,
    getSalesAnalytics,
    getOrdersAnalytics,
    getUserPercentage,
    sendInvoiceOfOrder
}