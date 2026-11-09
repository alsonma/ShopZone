
import express from "express";

import {
    createproduct,
    getAllProducts,
    getMyProducts,
    updateProduct,
    deleteProduct,
    getSellerAnalytics,
    activateProduct,
    getProductById
} from "../controller/product.controller.js";

import {
    verifyToken,
    verifySeller
} from "../middleware/auth.middleware.js";

import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// GET ALL ACTIVE PRODUCTS
router.get("/", getAllProducts);

// GET SELLER'S PRODUCTS
router.get(
    "/my-products",
    verifyToken,
    verifySeller,
    getMyProducts
);

// GET SELLER ANALYTICS
router.get(
    "/seller-analytics",
    verifyToken,
    verifySeller,
    getSellerAnalytics
);

// GET SINGLE PRODUCT DETAILS
// Keep this AFTER all fixed routes
router.get("/:id", getProductById);

// CREATE PRODUCT
router.post(
    "/",
    verifyToken,
    verifySeller,
    upload.single("image"),
    createproduct
);

// UPDATE PRODUCT
router.put(
    "/:id",
    verifyToken,
    verifySeller,
    upload.single("image"),
    updateProduct
);

// DELETE / DEACTIVATE PRODUCT
router.delete(
    "/:id",
    verifyToken,
    verifySeller,
    deleteProduct
);

// ACTIVATE PRODUCT
router.patch(
    "/:id/activate",
    verifyToken,
    verifySeller,
    activateProduct
);

export default router;
