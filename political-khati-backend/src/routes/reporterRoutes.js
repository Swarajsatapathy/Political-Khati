import express from "express";

import {
  createReporter,
  getReporters,
  getReporterById,
  updateReporter,
  deleteReporter,
} from "../controllers/reporterController.js";

import upload from "../middlewares/upload.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Admin Routes                                                               */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  protectAdmin,
  upload.single("photo"),
  createReporter,
);

router.put(
  "/:id",
  protectAdmin,
  upload.single("photo"),
  updateReporter,
);

router.delete(
  "/:id",
  protectAdmin,
  deleteReporter,
);

/* -------------------------------------------------------------------------- */
/* Public Routes                                                              */
/* -------------------------------------------------------------------------- */

router.get("/", getReporters);

router.get("/:id", getReporterById);

export default router;