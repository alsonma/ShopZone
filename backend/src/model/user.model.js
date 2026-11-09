
import mongoose from "mongoose";

// ======================================
// ADDRESS SCHEMA
// ======================================

const addressSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        house: {
            type: String,
            required: true,
            trim: true
        },

        street: {
            type: String,
            required: true,
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        state: {
            type: String,
            required: true,
            trim: true
        },

        pincode: {
            type: String,
            required: true,
            trim: true
        },

        landmark: {
            type: String,
            default: "",
            trim: true
        },

        addressType: {
            type: String,
            enum: ["Home", "Work", "Other"],
            default: "Home"
        },

        isDefault: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);


// ======================================
// USER SCHEMA
// ======================================

const userSchema = new mongoose.Schema(
    {
        // USER INFORMATION
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            trim: true,
            select: false
        },

        // USER ROLE
        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            default: "customer"
        },

        // CUSTOMER ADDRESSES
        addresses: {
            type: [addressSchema],
            default: []
        },

        // CUSTOMER WISHLIST
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ]
    },
    { timestamps: true }
);


const User = mongoose.model("User", userSchema);

export default User;
