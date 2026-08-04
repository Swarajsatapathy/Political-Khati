import express from "express";

import upload from "../middlewares/upload.js";
import { uploadToS3 } from "../utils/s3Upload.js";

const router = express.Router();

router.post(
  "/upload",
  upload.single("image"),
  async (req, res) => {
    const uploaded = await uploadToS3(
      req.file.buffer,
      req.file.mimetype,
      "test"
    );

    res.json(uploaded);
  }
);

export default router;