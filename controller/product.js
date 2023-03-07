const Product = require("../models/Product");
const { JOIproductSchemaValidate } = require("../middlewares/JoiValidator");
const tryCatch = require("../utils/tryCatch");
const customError = require("../utils/customError");
const { getDataUri } = require("../utils/dataURI")
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

    if (error) throw new customError(`${error.details[0].message}`, 400)

    const saveProduct = new Product(value);


    const files = req?.files;
    if (files) {
        let images = await Promise.all(
            files.map(async (file) => {
              const fileURI = getDataUri(file);
              const myCloud = await cloudinary.uploader.upload(fileURI.content, {
                folder: "Products"
              });
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

    const productP = await Product.findById(prodID);

    updatesSent.forEach(update => {
        productP[update] = req.body[update];
    })

    let product;

    const files = req?.files;
    if (files.length > 0) {
        try {
            productP.images.map( async (image) => {
                await cloudinary.uploader.destroy(image.public_id);
            })
            
            productP.images = await Promise.all(
                files.map(async (file) => {
                  const fileURI = getDataUri(file);
                  const myCloud = await cloudinary.uploader.upload(fileURI.content, {
                    folder: "Products"
                  });
                  return {
                    public_id: myCloud.public_id,
                    url: myCloud.url,
                  };
                })
              );

            product = await productP.save();
        }
        catch (err) {
            console.log(err);
        }

    }
    else {
        product = await productP.save();
    }

    return res.status(201).json({
        product
    });
})




// delete product
const deleteProduct = tryCatch(async (req, res, next) => {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id)

    if (!deletedProduct) throw new customError("No record found", 500)

   if (deletedProduct.image) {
    await Promise.all( deleteProduct.images?.map( async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
    }))
   }

    const product = deletedProduct._doc;

    return res.status(200).json( product )
})



// get particular product
const getOneProduct = tryCatch(async (req, res) => {
    const product = await Product.findById(req.params.id)

    if (!product) throw new Error("No record found")

    return res.status(200).json(product)
})



// get all products
const getAllProducts = tryCatch(async (req, res) => {

    let products;
    // query
    const querySort = req.query.sort
    const limitPrice = parseInt(req.query.limitprice)
    const queryLimit = parseInt(req.query.limit);
    const subIds = req.query.subIds;

    let queries = { }
    let options = {}

    //sort by price limit 
    if (limitPrice) {
        queries.price = {$lte: limitPrice} ;
    }

    // categorical retrieve
    if (subIds) {
        const childrenCats = subIds.split(",");
        queries.category = { $in: childrenCats};
    }

    // pagination
    if (queryLimit) {
        options.limit = queryLimit;
    }

    // sort by price order
    if (querySort) {
        if (querySort === "asc") {
            options.sort = {price: 1};
        }
        else if (querySort === "desc"){
            options.sort = {price: -1};
        }
        else {
            options.sort = {createdAt: -1};
        }
    }


    // sort ({parameter: asc or desc})
    // limit => pagination (limit(how many))
    // console.log(options, queries);
    products = await Product.find(queries, null, options);

    if (!products) throw new customError("No record found", 404);

    return res.status(200).json(products)
})




module.exports = {
    addProduct,
    updateProduct,
    deleteProduct,
    getOneProduct,
    getAllProducts
}
