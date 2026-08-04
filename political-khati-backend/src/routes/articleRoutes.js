import express from "express";

import {
  createArticle,
  getPublishedArticles,
  getAdminArticles,
  getArticleBySlug,
  getAdminArticleById,
  updateArticle,
  deleteArticle,
  getFlashStories,
} from "../controllers/articleController.js";

import upload from "../middlewares/upload.js";
import { protectAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Special Routes
|--------------------------------------------------------------------------
*/

router.get("/flash", getFlashStories);

router.get(
  "/admin/all",
  protectAdmin,
  getAdminArticles
);

router.get(
  "/admin/:id",
  protectAdmin,
  getAdminArticleById
);

/*
|--------------------------------------------------------------------------
| CRUD Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  protectAdmin,
  upload.array("images", 5),
  createArticle
);

router.get("/", getPublishedArticles);

router.get("/:slug", getArticleBySlug);

router.put(
  "/:id",
  protectAdmin,
  upload.array("images", 5),
  updateArticle
);

router.delete(
  "/:id",
  protectAdmin,
  deleteArticle
);

export default router;