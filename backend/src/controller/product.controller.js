import Store from "../model/store.model.js";
import Product from "../model/product.model.js";
import Order from "../model/order.model.js";
import Review from "../model/review.model.js";

// CREATE PRODUCT
export const createproduct = async (req, res) => {
    try {
        console.log("CREATE PRODUCT REQUEST");
        console.log("Body:", req.body);
        console.log("User:", req.user);
        console.log("Uploaded file:", req.file);

        const { name, price, stock, desc, category } = req.body;

        if (
            !name?.trim() ||
            price === undefined ||
            price === "" ||
            stock === undefined ||
            stock === "" ||
            !desc?.trim() ||
            !category?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required product details."
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid price."
            });
        }

        if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative whole number."
            });
        }

        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: "Seller authentication is missing."
            });
        }

        // The seller creates products for their own active store.
        const store = await Store.findOne({
            owner: req.user.id,
            status: "active"
        });

        if (!store) {
            return res.status(403).json({
                success: false,
                message: "Create an active store before adding products."
            });
        }

        const product = await Product.create({
            name: name.trim(),
            price: Number(price),
            stock: Number(stock),
            desc: desc.trim(),
            category: category.trim(),
            imageUrl: req.file?.filename
                ? `/uploads/${req.file.filename}`
                : "",
            createdBy: req.user.id,
            store: store._id
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully.",
            product
        });

    } catch (error) {
        console.error("CREATE PRODUCT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create product.",
            error: error.name
        });
    }
};


// GET ALL ACTIVE PRODUCTS
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true })
            .populate("createdBy", "name email")
            .populate("store", "storeName description logo phone address")
            .sort({ createdAt: -1 });

        const productIds = products.map((product) => product._id);

        const summaries = await Review.aggregate([
            { $match: { product: { $in: productIds } } },
            {
                $group: {
                    _id: "$product",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        const summaryByProduct = new Map(
            summaries.map((summary) => [String(summary._id), summary])
        );

        const productsWithRatings = products.map((product) => {
            const summary = summaryByProduct.get(String(product._id));

            return {
                ...product.toObject(),
                averageRating: summary
                    ? Number(summary.averageRating.toFixed(1))
                    : 0,
                totalReviews: summary?.totalReviews || 0
            };
        });

        return res.status(200).json({
            success: true,
            count: productsWithRatings.length,
            products: productsWithRatings
        });

    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message
        });
    }
};


// GET SELLER'S PRODUCTS INCLUDING INACTIVE PRODUCTS
export const getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({
            createdBy: req.user.id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        console.error("Get seller products error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your products",
            error: error.message
        });
    }
};


// UPDATE OWN PRODUCT
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user.id,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Active product not found or you are not authorized to update it."
            });
        }

        const { name, category, price, stock, desc, imageUrl } = req.body;

        if (
            name === undefined ||
            category === undefined ||
            price === undefined ||
            stock === undefined ||
            desc === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all product fields."
            });
        }

        if (
            typeof name !== "string" ||
            typeof category !== "string" ||
            typeof desc !== "string" ||
            !name.trim() ||
            !category.trim() ||
            !desc.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Product fields cannot be empty."
            });
        }

        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product price."
            });
        }

        if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative whole number."
            });
        }

        product.name = name.trim();
        product.category = category.trim();
        product.price = Number(price);
        product.stock = Number(stock);
        product.desc = desc.trim();

        if (req.file) {
            product.imageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrl !== undefined) {
            product.imageUrl = imageUrl;
        }

        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message
        });
    }
};


// DEACTIVATE PRODUCT
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user.id,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Active product not found or you are not authorized to deactivate it."
            });
        }

        product.isActive = false;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product moved to inactive products",
            product
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to deactivate product",
            error: error.message
        });
    }
};


// SELLER ANALYTICS
export const getSellerAnalytics = async (req, res) => {
    try {
        const sellerId = req.user.id;

        // 1. GET ALL SELLER PRODUCTS
        const allSellerProducts = await Product.find({
            createdBy: sellerId
        }).select("name price stock category isActive");

        const allProductIds = allSellerProducts.map(
            product => product._id
        );

        // 2. GET ALL NON-CANCELLED ORDERS
        const sellerOrders = allProductIds.length
            ? await Order.find({
                "items.product": { $in: allProductIds },
                status: { $nin: ["cancelled"] }
            }).select("items createdAt status")
            : [];

        // 3. TRACK ORDERED QUANTITIES PER PRODUCT
        const soldMap = {};

        allProductIds.forEach(id => {
            soldMap[id.toString()] = 0;
        });

        const salesRecords = [];

        sellerOrders.forEach(order => {
            let orderUnits = 0;
            let orderAmount = 0;

            order.items.forEach(item => {
                const productId = item.product?.toString();

                if (
                    productId &&
                    Object.prototype.hasOwnProperty.call(soldMap, productId)
                ) {
                    const quantity = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;

                    soldMap[productId] += quantity;
                    orderUnits += quantity;
                    orderAmount += price * quantity;
                }
            });

            if (orderUnits > 0) {
                salesRecords.push({
                    date: new Date(order.createdAt),
                    units: orderUnits,
                    amount: orderAmount
                });
            }
        });

        // 4. ACTIVE PRODUCTS ONLY FOR INVENTORY STATISTICS
        const activeProducts = allSellerProducts.filter(
            product => product.isActive
        );

        const productAnalysis = activeProducts.map(product => ({
            _id: product._id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            sold: soldMap[product._id.toString()] || 0,
            isActive: product.isActive
        }));

        // 5. INVENTORY STATISTICS
        const totalProducts = activeProducts.length;

        const totalAvailableStock = activeProducts.reduce(
            (total, product) => total + product.stock,
            0
        );

        const totalUnitsOrdered = activeProducts.reduce(
            (total, product) =>
                total + (soldMap[product._id.toString()] || 0),
            0
        );

        const lowStockProducts = activeProducts.filter(
            product => product.stock > 0 && product.stock < 3
        );

        const outOfStockProducts = activeProducts.filter(
            product => product.stock === 0
        );

        const lowStockCount = lowStockProducts.length;
        const outOfStockCount = outOfStockProducts.length;

        // 6. LOCAL DATE HELPER (INDIA LOCAL TIME)
        const getLocalDateKey = date => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        // 7. SALES SUMMARY HELPER
        const summarizeSales = (
            records,
            getKey,
            getLabel,
            allowedKeys
        ) => {
            const summaryMap = {};

            records.forEach(record => {
                const key = getKey(record.date);

                if (!allowedKeys.has(key)) return;

                if (!summaryMap[key]) {
                    summaryMap[key] = {
                        label: getLabel(record.date),
                        orders: 0,
                        units: 0,
                        amount: 0
                    };
                }

                summaryMap[key].orders += 1;
                summaryMap[key].units += record.units;
                summaryMap[key].amount += record.amount;
            });

            return Object.values(summaryMap);
        };

        const today = new Date();

        // 8. DAILY REPORT - LAST 7 DAYS
        const dailyDates = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);

            dailyDates.push(date);
        }

        const dailyKeys = new Set(
            dailyDates.map(date => getLocalDateKey(date))
        );

        const dailySales = summarizeSales(
            salesRecords,
            date => getLocalDateKey(date),
            date => date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short"
            }),
            dailyKeys
        );

        // 9. MONTHLY REPORT - LAST 12 MONTHS
        const monthlyDates = [];

        for (let i = 11; i >= 0; i--) {
            monthlyDates.push(
                new Date(
                    today.getFullYear(),
                    today.getMonth() - i,
                    1
                )
            );
        }

        const monthlyKeys = new Set(
            monthlyDates.map(date =>
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            )
        );

        const monthlySales = summarizeSales(
            salesRecords,
            date =>
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            date => date.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric"
            }),
            monthlyKeys
        );

        // 10. YEARLY REPORT - LAST 5 YEARS
        const yearlyDates = [];

        for (let i = 4; i >= 0; i--) {
            yearlyDates.push(today.getFullYear() - i);
        }

        const yearlyKeys = new Set(
            yearlyDates.map(year => String(year))
        );

        const yearlySales = summarizeSales(
            salesRecords,
            date => String(date.getFullYear()),
            date => String(date.getFullYear()),
            yearlyKeys
        );

        // 11. SEND ANALYTICS TO FRONTEND
        return res.status(200).json({
            success: true,
            analytics: {
                totalProducts,
                totalAvailableStock,
                totalUnitsOrdered,

                lowStockCount,
                outOfStockCount,

                lowStockProducts,
                outOfStockProducts,

                productAnalysis,

                sales: {
                    daily: dailySales,
                    monthly: monthlySales,
                    yearly: yearlySales
                }
            }
        });

    } catch (error) {
        console.error("Seller Analytics Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch seller analytics",
            error: error.message
        });
    }
};


// REACTIVATE INACTIVE PRODUCT
export const activateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        product.isActive = true;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product activated successfully.",
            product
        });

    } catch (error) {
        console.error("Activate product error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to activate product.",
            error: error.message
        });
    }
};

import mongoose from "mongoose";

// GET SINGLE PRODUCT DETAILS
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate product ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // Find product and seller details
        const product = await Product.findOne({
            _id: id,
            isActive: true
        })
            .populate("createdBy", "name email")
            .populate("store", "storeName description logo phone address");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Prefer the product's linked store; fall back for older products.
        const store = product.store || await Store.findOne({
            owner: product.createdBy?._id,
            status: "active"
        }).select("storeName description logo phone address");

        return res.status(200).json({
            success: true,
            product,
            store
        });

    } catch (error) {
        console.error("Get product details error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product details",
            error: error.message
        });
    }
};
