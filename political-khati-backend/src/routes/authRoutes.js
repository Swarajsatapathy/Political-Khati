import express from "express";

import {
  login,
  verify,
} from "../controllers/authController.js";

import {
  protectAdmin,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/login", login);

router.get("/verify", protectAdmin, verify);

export default router;