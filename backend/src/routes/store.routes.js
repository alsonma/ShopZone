import express from "express";
import { createStore, getMyStore } from "../controller/store.controller.js";
import { verifyToken, verifySeller } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", verifyToken, createStore);
router.get("/my-store", verifyToken, verifySeller, getMyStore);

export default router;
