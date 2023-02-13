const Product = require("../../models/Product");
const { JOIproductSchemaValidate } = require("../../middlewares/JoiValidator");
const tryCatch = require("../../utils/tryCatch");
const customError = require("../../utils/customError");
const sharp = require("sharp")
const { getDataUri } = require("../../utils/dataURI")
const cloudinary = require("cloudinary").v2;




// adding new products
const addProduct = tryCatch(async (req, res) => {
    const { title, description, category, price, quantity } = req.body;

    const productValue = {
        title,
        description,
        category,
        quantity,
        price,
        createdBy: req.user._id
    }

    const { error, value } = await JOIproductSchemaValidate(productValue);

    if (error) throw new customError(`${error.details[0].message}`, 202)

    const saveProduct = new Product(value);
    const files = req?.files;
    if (files) {
        let images = await Promise.all(
            files.map(async (file) => {
              const fileURI = getDataUri(file);
              const myCloud = await cloudinary.uploader.upload(fileURI.content);
              return {
                public_id: myCloud.public_id,
                url: myCloud.url,
              };
            })
          );

        saveProduct.images = images;
    }
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

    const { title, description, category, price, quantity } = req.body;


    const productP = await Product.findById(prodID);


    const files = req?.files;
    let images = [];
    if (files) {

        productP.images.map( async (image) => {
            await cloudinary.uploader.destroy(image.public_id);
        })
        
        images = await Promise.all(
            files.map(async (file) => {
              const fileURI = getDataUri(file);
              const myCloud = await cloudinary.uploader.upload(fileURI.content);
              return {
                public_id: myCloud.public_id,
                url: myCloud.url,
              };
            })
          );
    }
    else {
        images = productP.images;
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

    deleteProduct.images?.map( async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
    })

    const product = deletedProduct._doc;

    res.status(200).json( product )
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
