import express from "express";

import {
  createVideo,
  getPublishedVideos,
  getAdminVideos,
  getVideoBySlug,
  getAdminVideoById,
  updateVideo,
  deleteVideo,
  getFlashVideos,
} from "../controllers/videoController.js";

import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Special Routes
|--------------------------------------------------------------------------
*/

router.get("/flash", getFlashVideos);

router.get(
  "/admin/all",
  protectAdmin,
  getAdminVideos
);

router.get(
  "/admin/:id",
  protectAdmin,
  getAdminVideoById
);

/*
|--------------------------------------------------------------------------
| CRUD Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protectAdmin,
  createVideo
);

router.get("/", getPublishedVideos);

router.get("/:slug", getVideoBySlug);

router.put(
  "/:id",
  protectAdmin,
  updateVideo
);

router.delete(
  "/:id",
  protectAdmin,
  deleteVideo
);

export default router;