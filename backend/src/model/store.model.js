
import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        storeName: {
            type: String,
            required: [true, "Store name is required"],
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        logo: {
            type: String,
            default: ""
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            fullAddress: {
                type: String,
                default: ""
            },
            street: {
                type: String,
                default: ""
            },
            city: {
                type: String,
                default: ""
            },
            state: {
                type: String,
                default: ""
            },
            postalCode: {
                type: String,
                default: ""
            },
            country: {
                type: String,
                default: ""
            }
        },

        location: {
            type: {
                type: String,
                enum: ["Point"]
            },
            coordinates: {
                type: [Number]
            }
        },

        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

// Supports location-based store searches later.
storeSchema.index({ location: "2dsphere" });

const Store = mongoose.model("Store", storeSchema);

export default Store;
