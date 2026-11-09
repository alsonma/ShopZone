import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"]
    },

    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, "Stock cannot be negative"],
        validate: {
            validator: function (value) {
                return Number.isInteger(value);
            },
            message: "Stock must be a whole number"
        }
    },

    price: {
        type: Number,
        required: [true, "Price is required"],
        min: 0
    },
    desc: {
        type: String,
        required: [true, "Description is required"],
    },
    imageUrl: {
        type: String,
        default: "",
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // Products belong to a store; createdBy remains for seller permissions
    // and compatibility with products created before stores were linked.
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
},
    { timestamps: true }
)
const Product = mongoose.model("Product", productSchema);

export default Product;
