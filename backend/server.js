
import express from "express";
import dotenv from "dotenv";
import { DatabaseConnection } from "./src/config/database.js";
import storeRoutes from "./src/routes/store.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import cors from "cors";
import customerouter from "./src/routes/customer.routes.js";
import orderRouter from "./src/routes/order.routes.js";
import cartrouter from "./src/routes/cart.routes.js";
import upload from "./src/middleware/upload.middleware.js";
import path from "path";
import reviewrouter from "./src/routes/review.routes.js";


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Database connection
DatabaseConnection();

// Middleware
app.use(cors({
    origin: "https://shopzone-lime.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}));

app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/customer", customerouter);
app.use("/api/orders", orderRouter);
app.use("/api/cart", cartrouter);
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/api/reviews", reviewrouter);

// Test API
app.get("/test", (req, res) => {
    try {
        res.status(200).json({
            status: true,
            message: "API fetched successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Internal Error"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server connected at http://localhost:${PORT}`);
});
