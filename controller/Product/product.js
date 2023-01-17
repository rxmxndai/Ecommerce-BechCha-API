const Product = require("../../models/Product");
const { JOIproductSchemaValidate } = require("../../middlewares/JoiValidator");
const tryCatch = require("../../utils/tryCatch");
const customError = require("../../utils/customError");
const sharp = require("sharp")




// adding new products
const addProduct = tryCatch(async (req, res) => {

    const {title, description, category, price, quantity} = req.body;
    let images = [];

    if (req.files.length > 0 ) {
        images = await Promise.all(req.files.map( async file => {
                const buffer =  await sharp(file.buffer).png().toBuffer()
                return { img: buffer }
            })
        );
    }

    console.log(images);

    const productValue = {
        title,
        description,
        images,
        category,
        quantity,
        price,
        createdBy: req.user._id
    }
    
    const {error, value}= await JOIproductSchemaValidate(productValue);
    
    if (error) throw new customError(`${error.details[0].message}`, 400)


    const saveProduct = new Product(value);

    const product = await saveProduct.save();

    return res.status(201).json({
       product
    });
})




// update product
const updateProduct = tryCatch(async (req, res) => {

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body,
            },
            { new: true }
        )
        console.log("Product added!");
        res.status(201).json(updatedProduct);
    }
    catch (err) {
        res.status(500).json(err)
    }
})




// delete product
const deleteProduct = tryCatch(async (req, res, next) => {

    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id)

        if (!deletedProduct) throw new Error("No record found")


        const { ...product } = deletedProduct._doc;

        res.status(200).json({ ...product, msg: "Product deleted" })
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get particular product
const getOneProduct = tryCatch(async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product) throw new Error("No record found")

        res.status(200).json(product)
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})



// get all products
const getAllProducts = tryCatch(async (req, res) => {

    // query
    const queryNew = req.query.new
    const queryCategoryID = req.query.category

    try {
        // sort ({parameter: asc or desc})
        // limit => pagination (limit(how many))

        let products;

        if (queryNew) {
            products = await Product.find()
            // .sort({createdAt: -1}).limit()
        }
        else if (queryCategoryID) {
            products = await Product.find({
                category: queryCategoryID
            })
                .sort({ createdAt: -1 }).limit()
        }
        else {
            products = await Product.find({});
        }

        if (!products) throw new Error("No record found")

        return res.status(200).json(products)
    }
    catch (err) {
        return res.status(500).json(err.message)
    }
})




module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
    getOneProduct,
    getAllProducts
}
