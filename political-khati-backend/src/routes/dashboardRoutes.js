import express from "express";

import { getDashboardStats } from "../controllers/dashboardController.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
  "/stats",
  protectAdmin,
  getDashboardStats
);

export default router;