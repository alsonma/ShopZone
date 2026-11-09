
import express from "express";

import {
    addReview,
    getProductReviews,
    getMyReviews,
    getSellerReviews
} from "../controller/review.controller.js";

import { verifyToken, verifySeller } from "../middleware/auth.middleware.js";

const reviewrouter = express.Router();

// Submit a review (login required)
reviewrouter.post("/", verifyToken, addReview);

// Customer checks which products they have already reviewed
reviewrouter.get("/my-reviews", verifyToken, getMyReviews);

// Seller reads reviews for their own products
reviewrouter.get("/seller", verifyToken, verifySeller, getSellerReviews);

// Get reviews for a product (public)
reviewrouter.get("/:productId", getProductReviews);

export default reviewrouter;
