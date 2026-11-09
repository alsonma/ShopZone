
import express from "express";

import {
    placeOrder,
    getMyOrders,
    getOrderById
} from "../controller/order.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const orderRouter = express.Router();

// Customer places an order
orderRouter.post("/", verifyToken, placeOrder);

// Customer views their own orders
orderRouter.get("/my-orders", verifyToken, getMyOrders);

// Customer views one of their orders
orderRouter.get("/:id", verifyToken, getOrderById);

export default orderRouter;
