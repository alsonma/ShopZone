
import Cart from "../model/cart.model.js";
import Product from "../model/product.model.js";

// GET CUSTOMER CART
export const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate("items.product");

        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: []
            });
        }

        return res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart",
            error: error.message
        });
    }
};


// ADD PRODUCT TO CART
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID and quantity are required"
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({
                user: req.user.id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        const newQuantity = existingItem
            ? existingItem.quantity + Number(quantity)
            : Number(quantity);

        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        if (existingItem) {
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity: Number(quantity)
            });
        }

        await cart.save();

        await cart.populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message
        });
    }
};


// UPDATE CART ITEM QUANTITY
export const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found"
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product || Number(quantity) > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity is unavailable"
            });
        }

        item.quantity = Number(quantity);

        await cart.save();
        await cart.populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update cart",
            error: error.message
        });
    }
};


// REMOVE PRODUCT FROM CART
export const removeFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.save();
        await cart.populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to remove product",
            error: error.message
        });
    }
};


// CLEAR CART
export const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to clear cart",
            error: error.message
        });
    }
};
