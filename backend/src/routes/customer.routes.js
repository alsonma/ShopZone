
import express from "express";

import {
    getProfile,
    updateProfile,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getMyOrders
} from "../controller/customer.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const customerouter = express.Router();

// All customer routes require authentication
customerouter.use(verifyToken);

// PROFILE
customerouter.get("/profile", getProfile);
customerouter.put("/profile", updateProfile);

// ADDRESSES
customerouter.get("/addresses", getAddresses);
customerouter.post("/addresses", addAddress);
customerouter.put("/addresses/:addressId", updateAddress);
customerouter.delete("/addresses/:addressId", deleteAddress);

// WISHLIST
customerouter.get("/wishlist", getWishlist);
customerouter.post("/wishlist/:productId", addToWishlist);
customerouter.delete("/wishlist/:productId", removeFromWishlist);

// ORDERS
customerouter.get("/orders", getMyOrders);

export default customerouter;
