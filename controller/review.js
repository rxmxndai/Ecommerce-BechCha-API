const { default: mongoose } = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Review = require("../models/Review");
const customError = require("../utils/customError");
const tryCatch = require("../utils/tryCatch");






const hasBought = tryCatch ( async( product, userId, next )  => {


  // Find all orders for the user
  const userOrders = await Order.find({ user: userId});

  if (userOrders.length === 0) {
    return next("No orders yet!", undefined);
  }

  // Check if the productId is included in any of the user's orders
  for (const order of userOrders) {
    const boughtProduct = order.products.some(
      (item) => item.product.toString() === product.toString()
    );

    if (boughtProduct) {
      return next(undefined, "Order found!");;
    }
  }

  return next("No such order!", undefined);
})




const addReview = tryCatch(async (req, res) => {
  let { product, rating, comment } = req.body;
  let userId = req.user._id;


  if (!product || !rating || !comment)
    throw new customError("Invalid request!", 400);


  await hasBought(product, userId, async (error, payload) => {
    if (error) {
      return res.status(400).json({msg: "Need to buy to review this product!"})
    }



    else 
    {
      const prod = await Product.findOne({ _id: product }).populate(["reviews"]);


      const prodExists = prod.reviews.some(
        (r) => r.user.toString() === userId.toString()
      );
        
    
    
      // if the product is already reviewed
      if (prodExists) {
        let review = prod.reviews.find(
          (r) => r.user.toString() === userId.toString()
        );
        
        review.rating = Number(rating);
        review.comment = comment;
    
        await review.save();
        return res.status(200).json({ msg: "Review updated!", review });
      }
      
      const review = new Review({
        user: req.user._id,
        product,
        rating: Number(rating),
        comment,
      });
    
      await review.save();
    
      // Add the review to the product's reviews array
      const updatedProduct = await Product.findByIdAndUpdate(
        product,
        { $push: { reviews: review } },
        { new: true }
      ).populate("reviews");
    
      return res.status(201).json({
        message: "Review added successfully!",
        product: updatedProduct.toObject(),
      });
    }

  }); 
  

 
});






// delete review
const deleteReview = tryCatch(async (req, res) => {
  const productId = req.params.id;

  const review = await Review.findOne({
    _id: req.user._id,
    product: productId,
  });

  console.log(review);

  if (!review) return res.status(404).json({ message: "Not reviewed yet!" });

  return res.status(200).json({ message: "Done", review });
});






module.exports = {
  addReview,
  deleteReview,
};
