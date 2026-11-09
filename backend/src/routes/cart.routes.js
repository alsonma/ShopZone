
import express from "express";

import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from "../controller/cart.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const cartrouter = express.Router();

cartrouter.get("/", verifyToken, getCart);

cartrouter.post("/add", verifyToken, addToCart);

cartrouter.put("/update/:productId", verifyToken, updateCartItem);

cartrouter.delete("/remove/:productId", verifyToken, removeFromCart);

cartrouter.delete("/clear", verifyToken, clearCart);

export default cartrouter;
