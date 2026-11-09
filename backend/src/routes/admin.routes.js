import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { verifyAdmin } from "../middleware/admin.middleware.js";
import { getAdminOverview, updateStoreAsAdmin, deleteStoreAsAdmin } from "../controller/admin.controller.js";

const router = express.Router();
router.use(verifyToken, verifyAdmin);
router.get("/overview", getAdminOverview);
router.put("/stores/:id", updateStoreAsAdmin);
router.delete("/stores/:id", deleteStoreAsAdmin);
export default router;
