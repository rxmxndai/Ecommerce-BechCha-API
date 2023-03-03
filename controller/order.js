const Order = require("../models/Order");
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
    return result = [(a-b) / b] * 100;
}

const addOrder = tryCatch(async (req, res, next) => {
    const order = new Order(req.body)
    const savedOrder = await order.save();
    return res.status(201).json(savedOrder);
})



const updateOrder = tryCatch(async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        {
            $set: req.body,
        },
        { new: true }
    )

    return res.status(201).json(updatedOrder);

})



const deleteOrder = tryCatch(async (req, res, next) => {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id)

    if (!deletedOrder) throw new Error("No record found")


    const { ...products } = deletedOrder._doc;

    return res.status(200).json({ ...products, msg: "Order deleted" })

})


const getOneOrder = tryCatch(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).populate(["userId", "products"])
    if (!orders) throw new Error("No record found")

    return res.status(200).json(orders)

})

const getAllOrders = tryCatch(async (req, res) => {
    const orders = await Order.find().populate([`userId`, "products"]);
    return res.status(200).json(orders)
})


const getSalesAnalytics = tryCatch( async (req, res) => {
    const SalesLastMonth = await Order.find({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate },
        status: "delivered",
        isPaid: true,
    });
    if (!SalesLastMonth) throw new customError("No sales last month", 404);

    const SalesThisMonth = await Order.find({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate },
        status: "delivered",
        isPaid: true,
    });
    
    if (!SalesThisMonth) throw new customError("No sales this month", 404);

    const totalSalesThisMonth = SalesThisMonth?.reduce((totalSales, order) => totalSales + order.totalAmount, 0);
    const totalSalesLastMonth = SalesLastMonth?.reduce((totalSales, order) => totalSales + order.totalAmount, 0);
    const result = DifferenceInPerc(totalSalesThisMonth, totalSalesLastMonth);


    // console.log(result, totalSalesLastMonth, totalSalesThisMonth);

    return res.status(200).json({result, totalSalesLastMonth, totalSalesThisMonth})
})




const getOrdersAnalytics = tryCatch( async (req, res) => {

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
        isPaid: true
    });
    const orderAmountPrev = ordersBefore.reduce((value, ord) => {
        return value + ord.totalAmount;
    }, 0)
    

    // orders document list which is paid and this month
    let ordersThis = await Order.find({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate },
        isPaid: true
    });
    const orderAmountNow = ordersThis.reduce((value, ord) => {
        return value + ord.totalAmount;
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


const getUserPercentage = tryCatch( async (req, res) => {
    const LastMonthCount = await User.countDocuments({
        createdAt: { $gte: lastMonthStartDate, $lte: lastMonthEndDate }
    });

    const ThisMonthCount = await User.countDocuments({
        createdAt: { $gte: currentMonthStartDate, $lte: currentMonthEndDate }
    });

    const userCountDifference = DifferenceInPerc(ThisMonthCount, LastMonthCount);

    return res.status(200).json({LastMonthCount, ThisMonthCount, userCountDifference})
})

module.exports = {
    addOrder,
    updateOrder,
    deleteOrder,
    getOneOrder,
    getAllOrders,
    getSalesAnalytics,
    getOrdersAnalytics,
    getUserPercentage,
}