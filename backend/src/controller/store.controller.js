
import Store from "../model/store.model.js";
import User from "../model/user.model.js";

// GET THE LOGGED-IN SELLER'S STORE
export const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id });

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "You do not have a store yet."
            });
        }

        return res.status(200).json({ success: true, store });
    } catch (error) {
        console.error("Get seller store error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch your store."
        });
    }
};

// CREATE STORE FOR LOGGED-IN CUSTOMER
export const createStore = async (req, res) => {
    try {
        const {
            storeName,
            description,
            phone,
            address,
            location
        } = req.body;

        // Check required field
        if (!storeName || !storeName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Store name is required"
            });
        }

        // Get logged-in user from JWT
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Only customers can create their first store
        if (user.role !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Only customers can create a store"
            });
        }

        // Check whether this user already owns a store
        const existingStore = await Store.findOne({
            owner: user._id
        });

        if (existingStore) {
            return res.status(409).json({
                success: false,
                message: "You already have a store"
            });
        }

        // Create store
        const storeData = {
            owner: user._id,
            storeName: storeName.trim(),
            description,
            phone,
            address
        };

        // Add location only when valid GPS coordinates are provided
        if (
            location?.coordinates &&
            location.coordinates.length === 2 &&
            location.coordinates.every(Number.isFinite)
        ) {
            storeData.location = {
                type: "Point",
                coordinates: location.coordinates
            };
        }

        const store = await Store.create(storeData);

        // Change customer role to seller
        user.role = "seller";
        await user.save();

        return res.status(201).json({
            success: true,
            message: "Your store has been created successfully",
            store,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Create store error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Store creation failed",
            error: error.message
        });
    }
};
