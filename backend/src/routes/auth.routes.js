
import express from "express";
import * as authcontroller from "../controller/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/register", authcontroller.register);
router.post("/login", authcontroller.login);
router.get("/verifytoken", verifyToken, (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Token verified successfully",
        user: req.user,
    });
});

router.post("/register", authcontroller.register);
router.post("/login", authcontroller.login);

export default router;
