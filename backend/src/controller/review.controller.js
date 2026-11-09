
import mongoose from "mongoose";
import Review from "../model/review.model.js";
import Product from "../model/product.model.js";
import Order from "../model/order.model.js";

// GET THE LOGGED-IN CUSTOMER'S REVIEWED PRODUCT IDS
export const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .select("order product rating comment createdAt");

        return res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error("Get customer reviews error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your reviews"
        });
    }
};

// ADD A REVIEW
export const addReview = async (req, res) => {
    try {
        const { orderId, productId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        // Validate product ID
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // Validate rating
        if (
            !Number.isInteger(Number(rating)) ||
            Number(rating) < 1 ||
            Number(rating) > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a whole number between 1 and 5"
            });
        }

        // Validate comment
        if (!comment || comment.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: "Please write a review with at least 3 characters"
            });
        }

        // Check whether product exists
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check whether customer has received this product
        const deliveredOrder = await Order.findOne({
            _id: orderId,
            user: userId,
            status: "delivered",
            "items.product": productId
        });

        if (!deliveredOrder) {
            return res.status(403).json({
                success: false,
                message: "You can review this product only after receiving it"
            });
        }

        // Check whether user has already reviewed this product
        const existingReview = await Review.findOne({
            order: orderId,
            product: productId,
            user: userId
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        // Save review
        const review = await Review.create({
            order: orderId,
            product: productId,
            user: userId,
            rating: Number(rating),
            comment: comment.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review
        });

    } catch (error) {
        // Handles duplicate review attempts at database level
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product"
            });
        }

        console.error("Add review error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to submit review",
            error: error.message
        });
    }
};


// GET ALL REVIEWS FOR A PRODUCT
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const reviews = await Review.find({ product: productId })
            .populate("user", "name")
            .sort({ createdAt: -1 });

        // Calculate average rating
        const result = await Review.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId)
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const summary = result.length > 0
            ? {
                averageRating: Number(result[0].averageRating.toFixed(1)),
                totalReviews: result[0].totalReviews
            }
            : {
                averageRating: 0,
                totalReviews: 0
            };

        return res.status(200).json({
            success: true,
            summary,
            reviews
        });

    } catch (error) {
        console.error("Get product reviews error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews",
            error: error.message
        });
    }
};
// GET REVIEWS FOR PRODUCTS OWNED BY THE LOGGED-IN SELLER
export const getSellerReviews = async (req, res) => {
    try {
        const products = await Product.find({ createdBy: req.user.id })
            .select("_id name");
        const productIds = products.map((product) => product._id);

        const [reviews, summaries] = await Promise.all([
            Review.find({ product: { $in: productIds } })
                .populate("product", "name")
                .populate("user", "name")
                .sort({ createdAt: -1 }),
            Review.aggregate([
                { $match: { product: { $in: productIds } } },
                {
                    $group: {
                        _id: "$product",
                        averageRating: { $avg: "$rating" },
                        totalReviews: { $sum: 1 }
                    }
                }
            ])
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            summaries: summaries.map((summary) => ({
                productId: String(summary._id),
                averageRating: Number(summary.averageRating.toFixed(1)),
                totalReviews: summary.totalReviews
            }))
        });
    } catch (error) {
        console.error("Get seller reviews error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch seller reviews"
        });
    }
};
