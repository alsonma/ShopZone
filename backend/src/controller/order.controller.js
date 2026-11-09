import mongoose from "mongoose";
import Order from "../model/order.model.js";
import Cart from "../model/cart.model.js";
import Product from "../model/product.model.js";

// PLACE ORDER
export const placeOrder = async (req, res) => {
    const updatedProducts = [];

    try {
        const userId = req.user.id;
        const { shippingAddress } = req.body;

        const requiredFields = [
            "fullName",
            "phone",
            "address",
            "city",
            "postalCode"
        ];

        if (
            !shippingAddress ||
            requiredFields.some(
                (field) => !shippingAddress[field]?.toString().trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a complete shipping address"
            });
        }

        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const item of cart.items) {
            const product = item.product;

            if (!product || !product.isActive) {
                throw new Error("One or more products are unavailable");
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            orderItems.push({
                product: product._id,
                name: product.name,
                imageUrl: product.imageUrl,
                price: product.price,
                quantity: item.quantity
            });

            totalAmount += product.price * item.quantity;
        }

        for (const item of cart.items) {
            const result = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    isActive: true,
                    stock: { $gte: item.quantity }
                },
                { $inc: { stock: -item.quantity } },
                { new: true }
            );

            if (!result) {
                throw new Error(
                    `Stock is no longer available for ${item.product.name}`
                );
            }

            updatedProducts.push({
                productId: item.product._id,
                quantity: item.quantity
            });
        }

        const order = await Order.create({
            user: userId,
            items: orderItems,
            shippingAddress,
            totalAmount,
            // This project uses a simulated payment confirmation. Reaching
            // this endpoint from the payment screen means payment succeeded.
            paymentStatus: "paid",
            status: "delivered"
        });

        cart.items = [];
        await cart.save();

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        console.error("Place order error:", error);

        for (const item of updatedProducts) {
            await Product.updateOne(
                { _id: item.productId },
                { $inc: { stock: item.quantity } }
            );
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Failed to place order"
        });
    }
};

// GET LOGGED-IN CUSTOMER'S ORDERS
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate("items.product", "name imageUrl")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error("Get orders error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};

// GET ONE ORDER BELONGING TO LOGGED-IN CUSTOMER
export const getOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID"
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate("items.product", "name imageUrl");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch order",
            error: error.message
        });
    }
};
