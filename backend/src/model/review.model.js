
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number"
            }
        },

        comment: {
            type: String,
            required: [true, "Review comment is required"],
            trim: true,
            minlength: [3, "Review must contain at least 3 characters"],
            maxlength: [1000, "Review cannot exceed 1000 characters"]
        }
    },
    {
        timestamps: true
    }
);

// One customer can review a product once per order.
reviewSchema.index(
    { order: 1, product: 1, user: 1 },
    { unique: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
