import mongoose from "mongoose";
import slugify from "slugify";

import DISTRICTS from "../constants/districts.js";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: 300,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    metaTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    metaDescription: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    metaKeywords: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      default: "Politics",
      trim: true,
    },

    youtubeUrl: {
      type: String,
      required: true,
      trim: true,
    },

    youtubeVideoId: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnail: {
      type: String,
      required: true,
    },

    reporter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    district: {
      type: String,
      required: true,
      enum: DISTRICTS,
      trim: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isFlash: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.pre("validate", function () {
  if (this.title) {
    if (!this.slug) {
      this.slug = slugify(this.title, {
        lower: true,
        strict: true,
      });
    }

    if (!this.metaTitle) {
      this.metaTitle = this.title;
    }
  }

  if (!this.metaDescription) {
    this.metaDescription = this.title;
  }
});

videoSchema.index({
  isPublished: 1,
  publishedAt: -1,
});

videoSchema.index({
  isFlash: 1,
  isPublished: 1,
});

videoSchema.index({
  district: 1,
  isPublished: 1,
});

videoSchema.index({
  category: 1,
  isPublished: 1,
});

videoSchema.index({
  createdAt: -1,
});

const Video = mongoose.model("Video", videoSchema);

export default Video;