const Order = require("../../models/Order");
const tryCatch = require("../../utils/tryCatch");
const { startOfMonth, endOfMonth, subMonths } = require('date-fns');
const customError = require("../../utils/customError");


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
    const orders = await Order.find({ userId: req.params.id }).populate(["userId", "products"])
    if (!orders) throw new Error("No record found")

    return res.status(200).json(orders)

})

const getAllOrders = tryCatch(async (req, res) => {
    const orders = await Order.find().populate([`userId`, "products"]);
    return res.status(200).json(orders)
})


const getSalesAnalytics = tryCatch( async (req, res) => {

    const now = new Date();
    const lastMonthStartDate = startOfMonth(subMonths(now, 1));
    const lastMonthEndDate = endOfMonth(subMonths(now, 1));
    const currentMonthStartDate = startOfMonth(now);
    const currentMonthEndDate = endOfMonth(now);

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
        isDelivered: true,
    });
    
    if (!SalesThisMonth) throw new customError("No sales this month", 404);

    const totalSalesThisMonth = SalesThisMonth?.reduce((totalSales, order) => totalSales + order.totalAmount, 0);
    const totalSalesLastMonth = SalesLastMonth?.reduce((totalSales, order) => totalSales + order.totalAmount, 0);


    const result = [(totalSalesThisMonth - totalSalesLastMonth )/ totalSalesLastMonth ]* 100;

    return res.status(200).json({result, totalSalesLastMonth, totalSalesThisMonth})
})

module.exports = {
    addOrder,
    updateOrder,
    deleteOrder,
    getOneOrder,
    getAllOrders,
    getSalesAnalytics
}