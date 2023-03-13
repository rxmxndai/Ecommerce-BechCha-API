const Order = require("../models/Order");
const Product = require("../models/Product");
const tryCatch = require("../utils/tryCatch");
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
const customError = require("../utils/customError");
const User = require("../models/User");



const now = new Date();
const lastMonthStartDate = startOfMonth(subMonths(now, 1));
const lastMonthEndDate = endOfMonth(subMonths(now, 1));
const currentMonthStartDate = startOfMonth(now);
const currentMonthEndDate = endOfMonth(now);

const DifferenceInPerc = (a, b) => {
    return result = [(a - b) / b] * 100;
}








/// add or place an order
const addOrder = tryCatch(async (req, res) => {

    const { products, payable, totalItems } = req.body;

    if (!products || products.length <= 0 || !payable || !totalItems) {
        throw new customError("Order details insufficient. Provide all details.", 400);
    }

    const values = {
        user: req.user._id,
        payable,
        totalItems,
        products
    };

    const order = await new Order(values).save();
    return res.status(201).json(order);
})



// cancel order
const cancelOrder = tryCatch(async (req, res) => {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) throw new customError("No order found!", 404);

    if (order.status === "pending") {
        order.status = "cancelled";
        await order.save();
        return res.status(202).json("Order cancelled.")
    }
    else {
        return res.status(400).json("Order cannot be cancelled now.")
    }
})



// update order
const updateOrder = tryCatch(async (req, res) => {
    const orderId = req.params.id;
    const status = req.body.status;

    if (!status) throw new customError("Invalid status!", 400);

    const order = await Order.findById(orderId);

    if (!order) throw new customError("No order found!", 404);

    if (status === "delivered") {
        order.status = status;
        await order.save();

        const productsArray = order.products;
        for (let update of productsArray) {
            await Product.updateOne(
                { _id: update.product },
                {
                    "$inc": {
                        quantity: -update.quantity
                    },
                    "$set": {
                        sold: +1,
                    }
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

    return res.status(200).json({ ...products, msg: "Order deleted" })

})



// get One user's orderList
const getUserOrders = tryCatch(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }, null, { sort: { createdAt: -1 } }).populate(["user", "products.product"])
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
}