const Product = require("../models/Product");
const Category = require("../models/Category");
const { JOIproductSchemaValidate } = require("../middlewares/JoiValidator");
const tryCatch = require("../utils/tryCatch");
const customError = require("../utils/customError");
const { getDataUri } = require("../utils/dataURI");
const cloudinary = require("cloudinary").v2;

// adding new products
const addProduct = tryCatch(async (req, res) => {
  const { title, description, category, price, quantity, brand } = req.body;

  const productValue = {
    title,
    description,
    brand,
    category,
    quantity,
    price,
    createdBy: req.user._id,
  };

  const { error, value } = await JOIproductSchemaValidate(productValue);

  if (error) throw new customError(`${error.details[0].message}`, 400);

  const saveProduct = new Product(value);

  const files = req?.files;
  if (files) {
    let images = await Promise.all(
      files.map(async (file) => {
        const fileURI = getDataUri(file);
        const myCloud = await cloudinary.uploader.upload(fileURI.content, {
          folder: "Products",
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
    product,
  });
});

// update product
const updateProduct = tryCatch(async (req, res) => {
  const prodID = req.params.id;
  if (!prodID) return res.status(400).json({ message: "No product selected!" });

  const allowedUpdates = [
    "title",
    "description",
    "category",
    "brand",
    "specification",
    "price",
    "quantity",
    "review",
  ];
  const updatesSent = Object.keys(req.body);

  const isValid = updatesSent.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValid) throw new customError("Some fields cannot be changed!", 400);

  const productP = await Product.findById(prodID);

  updatesSent.forEach((update) => {
    console.log(update);
    productP[update] = req.body[update];
  });

  let product;

  const files = req?.files;
  if (files.length > 0) {
    try {
      productP.images.map(async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
      });

      productP.images = await Promise.all(
        files.map(async (file) => {
          const fileURI = getDataUri(file);
          const myCloud = await cloudinary.uploader.upload(fileURI.content, {
            folder: "Products",
          });
          return {
            public_id: myCloud.public_id,
            url: myCloud.url,
          };
        })
      );

      product = await productP.save();
    } catch (err) {
      console.log(err);
    }
  } else {
    product = await productP.save();
  }

  return res.status(201).json({
    product,
  });
});

// delete product
const deleteProduct = tryCatch(async (req, res, next) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (!deletedProduct) throw new customError("No record found", 500);

  if (deletedProduct.image) {
    await Promise.all(
      deleteProduct.images?.map(async (image) => {
        await cloudinary.uploader.destroy(image.public_id);
      })
    );
  }

  const product = deletedProduct._doc;

  return res.status(200).json(product);
});

// get particular product
const getOneProduct = tryCatch(async (req, res) => {
  const product = await Product.findById(req.params.id).populate([
    { path: "category", select: ["name", "_id"] },
    {
      path: "reviews",
      populate: { path: "user", select: ["username", "image"] },
    },
  ]);

  if (!product) throw new Error("No record found");

  return res.status(200).json(product);
});

// const getProducts by query indexing

const getIndexedProducts = tryCatch(async (req, res) => {
  const search = req.query.search;
  const limit = parseInt(req.query.limit) === 0 ? 100000 :  parseInt(req.query.limit) ;
  const sort = req.query.sort === "desc" ? -1 : 1;

  // console.log(search, limit, sort);

  const matchStage = {
    $match: {
      price: { $lte: limit },
    },
  };

  const searchStage = {
    $search: {
      index: "products",
      autocomplete: {
        query: search,
        path: "title",
        fuzzy: {
          maxEdits: 2,
        },
      },
    },
  };

  const sortStage = {
    $sort: {
      price: sort,
    },
  };

  const projectStage = {
    $project: {
      _id: 1,
      title: 1,
      image: { $arrayElemAt: ["$images", 0] },
      price: 1,
    },
  };

  const aggregation = [searchStage, matchStage, sortStage, projectStage];

  
  const products = await Product.aggregate(aggregation);
  // console.log(products);

  if (!products) throw new customError("No products found", 404);

  return res.status(200).json({ products, msg: "search results" });
});




// get all products
const getAllProducts = tryCatch(async (req, res) => {
  let products;
  // query
  const querySearch = req.query.search;
  const querySort = req.query.sort;
  const limitPrice = parseInt(req.query.limitprice);
  const queryLimit = parseInt(req.query.limit);
  const subIds = req.query.subIds;

  let queries = {};
  let options = {};

  //sort by price limit
  if (limitPrice) {
    queries.price = { $lte: limitPrice };
  }

  // categorical retrieve
  if (subIds) {
    const childrenCats = subIds.split(",");
    queries.category = { $in: childrenCats };
  }

  // pagination
  if (queryLimit) {
    options.limit = queryLimit;
  }

  // sort by price order
  if (querySort) {
    if (querySort === "asc") {
      options.sort = { price: 1 };
    } else if (querySort === "desc") {
      options.sort = { price: -1 };
    } else if (querySort === "sold") {
      options.sort = { sold: -1 };
    } else if (querySort === "quantity") {
      options.sort = { quantity: 1 };
    } else {
      options.sort = { createdAt: -1 };
    }
  }

  if (querySearch) {
    queries.$or = [
      { title: new RegExp(querySearch, "i") },
      { brand: new RegExp(querySearch, "i") },
    ];
  }

  products = await Product.find(
    queries,
    ["_id", "title", "price", "images", "quantity"],
    options
  ).populate({
    path: "category",
    select: ["_id", "name"],
  });

  if (!products) throw new customError("No record found", 404);

  return res.status(200).json(products);
});

// get categorical distribution of products

const getCategoricalDistribution = tryCatch(async (req, res) => {
  const projection = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $project: { category: "$_id", productsCount: "$count", _id: 0 } },
  ]);

  // Map over the results and populate the category field with the corresponding category name
  const catResult = await Promise.all(
    projection.map(async (result) => {
      const category = await Category.findById(result.category);
      return { category: category.name, productsCount: result.productsCount };
    })
  );

  return res.status(200).json(catResult);
});

/// update featured
const updateFeaturedProds = tryCatch(async (req, res) => {
  const { products } = req.body;

  // remove all featured
  await Product.updateMany(
    { isFeatured: true },
    {
      $set: {
        isFeatured: false,
      },
    }
  );

  Object.values(products).map(async (prod) => {
    await Product.findByIdAndUpdate(prod, {
      $set: {
        isFeatured: true,
      },
    });
  });

  return res.status(200).json("Done updating featured products!");
});

/// update featured
const getFeaturedProducts = tryCatch(async (req, res) => {
  const products = await Product.find({ isFeatured: true });
  return res.status(200).json(products);
});

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getOneProduct,
  getAllProducts,
  getCategoricalDistribution,
  updateFeaturedProds,
  getFeaturedProducts,
  getIndexedProducts,
};
