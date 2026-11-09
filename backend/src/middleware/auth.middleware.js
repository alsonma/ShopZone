import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

// Check the current database role so a token issued before store creation
// does not keep blocking the newly promoted seller.
export const verifySeller = async (req, res, next) => {
    try {
        const user = await User.findById(req.user?.id).select("role");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found. Please log in again."
            });
        }

        req.user.role = user.role;

        if (user.role !== "seller") {
            return res.status(403).json({
                success: false,
                message: "Only sellers can perform this action"
            });
        }

        next();
    } catch (error) {
        console.error("Seller authorization error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to verify seller access"
        });
    }
};

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in."
            });
        }

        const accessToken = authHeader.split(" ")[1];
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};
