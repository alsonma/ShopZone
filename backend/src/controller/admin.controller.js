import Store from "../model/store.model.js";
import Product from "../model/product.model.js";
import Order from "../model/order.model.js";
import User from "../model/user.model.js";
import Cart from "../model/cart.model.js";
import Review from "../model/review.model.js";
import mongoose from "mongoose";

export const getAdminOverview = async (req, res) => {
    try {
        const [stores, products, orders] = await Promise.all([
            Store.find().populate("owner", "name email").sort({ createdAt: -1 }),
            Product.find().populate("store", "storeName").populate("createdBy", "name email").sort({ createdAt: -1 }),
            Order.find().select("items totalAmount status paymentStatus createdAt")
        ]);

        const storeById = new Map(stores.map((store) => [String(store._id), store]));
        const storeByOwner = new Map(stores.map((store) => [String(store.owner?._id || store.owner), store]));
        const productStore = new Map();
        for (const product of products) {
            const store = product.store || storeByOwner.get(String(product.createdBy?._id || product.createdBy));
            if (store) productStore.set(String(product._id), String(store._id));
        }

        const salesByStore = new Map();
        let totalSales = 0;
        let includedOrders = 0;
        for (const order of orders) {
            if (["cancelled"].includes(order.status) || ["failed", "refunded"].includes(order.paymentStatus)) continue;
            includedOrders += 1;
            for (const item of order.items || []) {
                const storeId = productStore.get(String(item.product));
                if (!storeId) continue;
                const amount = Number(item.price || 0) * Number(item.quantity || 0);
                totalSales += amount;
                const stats = salesByStore.get(storeId) || { sales: 0, orderIds: new Set() };
                stats.sales += amount;
                stats.orderIds.add(String(order._id));
                salesByStore.set(storeId, stats);
            }
        }

        const storesWithStats = stores.map((store) => {
            const ownerId = String(store.owner?._id || store.owner);
            const storeProducts = products.filter((product) =>
                String(product.store?._id || product.store || "") === String(store._id) ||
                (!product.store && String(product.createdBy?._id || product.createdBy) === ownerId)
            );
            const stats = salesByStore.get(String(store._id)) || { sales: 0, orderIds: new Set() };
            return {
                ...store.toObject(),
                products: storeProducts,
                productCount: storeProducts.length,
                sales: Number(stats.sales.toFixed(2)),
                orderCount: stats.orderIds.size
            };
        });

        return res.json({
            success: true,
            overview: {
                totalSales: Number(totalSales.toFixed(2)),
                totalOrders: includedOrders,
                totalProducts: products.length,
                totalStores: stores.length,
                stores: storesWithStats,
                products
            }
        });
    } catch (error) {
        console.error("Admin overview error:", error);
        return res.status(500).json({ success: false, message: "Failed to load admin overview" });
    }
};

export const updateStoreAsAdmin = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid store ID" });
        }
        const allowed = ["storeName", "description", "phone", "address", "status"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (updates.storeName !== undefined) {
            if (!String(updates.storeName).trim()) return res.status(400).json({ success: false, message: "Store name is required" });
            updates.storeName = String(updates.storeName).trim();
        }
        if (updates.status !== undefined && !["active", "suspended"].includes(updates.status)) {
            return res.status(400).json({ success: false, message: "Store status must be active or suspended" });
        }
        const store = await Store.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).populate("owner", "name email");
        if (!store) return res.status(404).json({ success: false, message: "Store not found" });
        return res.json({ success: true, message: "Store updated successfully", store });
    } catch (error) {
        console.error("Admin update store error:", error);
        return res.status(500).json({ success: false, message: "Failed to update store" });
    }
};

export const deleteStoreAsAdmin = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid store ID" });
        }
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ success: false, message: "Store not found" });

        const products = await Product.find({ $or: [{ store: store._id }, { createdBy: store.owner }] }).select("_id");
        const productIds = products.map((product) => product._id);
        if (productIds.length) {
            await Promise.all([
                Product.deleteMany({ _id: { $in: productIds } }),
                Review.deleteMany({ product: { $in: productIds } }),
                Cart.updateMany({ "items.product": { $in: productIds } }, { $pull: { items: { product: { $in: productIds } } } })
            ]);
        }
        await Store.deleteOne({ _id: store._id });
        await User.updateOne({ _id: store.owner, role: "seller" }, { $set: { role: "customer" } });
        return res.json({ success: true, message: "Store and its products deleted", deletedProducts: productIds.length });
    } catch (error) {
        console.error("Admin delete store error:", error);
        return res.status(500).json({ success: false, message: "Failed to delete store" });
    }
};
