
import mongoose from "mongoose";

import User from "../model/user.model.js";
import Product from "../model/product.model.js";
import Order from "../model/order.model.js";

// ============================================
// GET CUSTOMER PROFILE
// GET /api/customer/profile
// ============================================

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Profile fetched successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to fetch profile",
            error: error.message
        });
    }
};


// ============================================
// UPDATE CUSTOMER PROFILE
// PUT /api/customer/profile
// ============================================

export const updateProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({
                status: false,
                message: "Name and email are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user.id }
        });

        if (existingUser) {
            return res.status(409).json({
                status: false,
                message: "Email is already registered"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: name.trim(),
                email: normalizedEmail
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
};


// ============================================
// GET CUSTOMER ADDRESSES
// GET /api/customer/addresses
// ============================================

export const getAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("addresses");

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: true,
            addresses: user.addresses
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to fetch addresses",
            error: error.message
        });
    }
};


// ============================================
// ADD CUSTOMER ADDRESS
// POST /api/customer/addresses
// ============================================

export const addAddress = async (req, res) => {
    try {
        const {
            fullName,
            phone,
            house,
            street,
            city,
            state,
            pincode,
            landmark,
            addressType,
            isDefault
        } = req.body;

        if (
            !fullName ||
            !phone ||
            !house ||
            !street ||
            !city ||
            !state ||
            !pincode
        ) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required address fields"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // If this address is default, remove default from others
        if (isDefault) {
            user.addresses.forEach(address => {
                address.isDefault = false;
            });
        }

        const newAddress = {
            fullName,
            phone,
            house,
            street,
            city,
            state,
            pincode,
            landmark: landmark || "",
            addressType: addressType || "Home",
            isDefault: isDefault || user.addresses.length === 0
        };

        user.addresses.push(newAddress);

        await user.save();

        return res.status(201).json({
            status: true,
            message: "Address added successfully",
            addresses: user.addresses
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to add address",
            error: error.message
        });
    }
};


// ============================================
// UPDATE CUSTOMER ADDRESS
// PUT /api/customer/addresses/:addressId
// ============================================

export const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid address ID"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: false,
                message: "Address not found"
            });
        }

        const allowedFields = [
            "fullName",
            "phone",
            "house",
            "street",
            "city",
            "state",
            "pincode",
            "landmark",
            "addressType"
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                address[field] = req.body[field];
            }
        });

        if (req.body.isDefault === true) {
            user.addresses.forEach(item => {
                item.isDefault = false;
            });

            address.isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            status: true,
            message: "Address updated successfully",
            addresses: user.addresses
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to update address",
            error: error.message
        });
    }
};


// ============================================
// DELETE CUSTOMER ADDRESS
// DELETE /api/customer/addresses/:addressId
// ============================================

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!mongoose.isValidObjectId(addressId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid address ID"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                status: false,
                message: "Address not found"
            });
        }

        const wasDefault = address.isDefault;

        address.deleteOne();

        // Make another address default if the default was deleted
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            status: true,
            message: "Address deleted successfully",
            addresses: user.addresses
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to delete address",
            error: error.message
        });
    }
};


// ============================================
// GET CUSTOMER WISHLIST
// GET /api/customer/wishlist
// ============================================

export const getWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("wishlist");

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: true,
            wishlist: user.wishlist
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to fetch wishlist",
            error: error.message
        });
    }
};


// ============================================
// ADD PRODUCT TO WISHLIST
// POST /api/customer/wishlist/:productId
// ============================================

export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const alreadyExists = user.wishlist.some(
            id => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(409).json({
                status: false,
                message: "Product is already in your wishlist"
            });
        }

        user.wishlist.push(productId);

        await user.save();

        return res.status(200).json({
            status: true,
            message: "Product added to wishlist",
            wishlist: user.wishlist
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to add product to wishlist",
            error: error.message
        });
    }
};


// ============================================
// REMOVE PRODUCT FROM WISHLIST
// DELETE /api/customer/wishlist/:productId
// ============================================

export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid product ID"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const exists = user.wishlist.some(
            id => id.toString() === productId
        );

        if (!exists) {
            return res.status(404).json({
                status: false,
                message: "Product is not in your wishlist"
            });
        }

        user.wishlist = user.wishlist.filter(
            id => id.toString() !== productId
        );

        await user.save();

        return res.status(200).json({
            status: true,
            message: "Product removed from wishlist",
            wishlist: user.wishlist
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to remove product from wishlist",
            error: error.message
        });
    }
};


// ============================================
// GET CUSTOMER ORDERS
// GET /api/customer/orders
// ============================================

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Orders fetched successfully",
            count: orders.length,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to fetch orders",
            error: error.message
        });
    }
};


