const Product = require("../../models/Product");
const { JOIproductSchemaValidate } = require("../../middlewares/JoiValidator");
const tryCatch = require("../../utils/tryCatch");
const customError = require("../../utils/customError");
const sharp = require("sharp")




// adding new products
const addProduct = tryCatch(async (req, res) => {
    const { title, description, category, price, quantity } = req.body;
    let images = [];

    if (req.files.length > 0) {
        images = await Promise.all(req.files.map(async file => {
            const buffer = await sharp(file.buffer).png().toBuffer()
            return buffer
        }));
    }

    const productValue = {
        title,
        description,
        images,
        category,
        quantity,
        price,
        // createdBy: req.user._id
    }

    const { error, value } = await JOIproductSchemaValidate(productValue);

    if (error) throw new customError(`${error.details[0].message}`, 202)

    const saveProduct = new Product(value);
    const product = await saveProduct.save();
    return res.status(201).json({
        product
    });
})




// update product
const updateProduct = tryCatch(async (req, res) => {
    const prodID = req.params.id
    if (!prodID) return res.status(400).json({message: "No product selected!"})

    const allowedUpdates = ["title", "description", "category", "specification", "price", "quantity"];
    const updatesSent = Object.keys(req.body);

    const isValid = updatesSent.every(update => allowedUpdates.includes(update))

    if (!isValid) throw new customError("Some fields cannot be changed!", 400);


    
    let images = [];
    const { title, description, category, price, quantity } = req.body;

    if (req.files.length > 0) {
        images = await Promise.all(req.files.map(async file => {
            const buffer = await sharp(file.buffer).png().toBuffer()
            return buffer;
        }))
    }
    else {
        const prod = await Product.findById(prodID);
        images = prod.images;
    }

    const value = {
        title,
        description,
        images,
        category,
        quantity,
        price,
        createdBy: req.user._id
    }

    const product = await Product.findByIdAndUpdate(prodID, value);
    return res.status(201).json({
        product
    });
})




// delete product
const deleteProduct = tryCatch(async (req, res, next) => {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

    if (!deletedProduct) throw new Error("No record found")


    const { ...product } = deletedProduct._doc;

    res.status(200).json({ ...product, msg: "Product deleted" })
})



// get particular product
const getOneProduct = tryCatch(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (!product) throw new Error("No record found")

    return res.status(200).json(product)
})



// get all products
const getAllProducts = tryCatch(async (req, res) => {

    // query
    const queryCategoryID = req.query.category
    const querySort = req.query.sort
    const limitPrice = parseInt(req.query.limitprice)
    const queryLimit = parseInt(req.query.limit) || 20;
    const queryPage = parseInt(req.query.page) || 1;

    let queries = { }
    let options = {}

    //sort by price limit 
    if (limitPrice) {
        queries.price = {$lte: limitPrice} ;
    }

    // pagination
    if (queryLimit && queryPage) {
        options.limit = queryLimit;
        options.skip = (queryPage - 1) * queryLimit;
    }

    // categorical retrieve
    if (queryCategoryID) queries.category = queryCategoryID;

    // sort by price order
    if (querySort) {
        if (querySort === "asc") {
            options.sort = {price: 1};
        }
        else if (querySort === "desc"){
            options.sort = {price: -1};
        }
    }

    

    // sort ({parameter: asc or desc})
    // limit => pagination (limit(how many))
    // console.log(options, queries);
    let products = await Product.find(queries, null, options);

    if (!products) throw new Error("No record found")

    return res.status(200).json({products})
})




module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
    getOneProduct,
    getAllProducts
}
