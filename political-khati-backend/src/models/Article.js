import mongoose from "mongoose";
import slugify from "slugify";

import DISTRICTS from "../constants/districts.js";

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
    },

    caption: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
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

    content: {
      type: String,
      default: "",
    },

    reporter: {
      type: String,
      required: [true, "Reporter name is required"],
      trim: true,
      maxlength: [150, "Reporter name cannot exceed 150 characters"],
    },

    district: {
      type: String,
      required: [true, "District is required"],
      enum: {
        values: DISTRICTS,
        message: "{VALUE} is not a valid district",
      },
      trim: true,
    },

    images: {
      type: [imageSchema],
      default: [],
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
      min: 0,
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Automatically generate SEO defaults
|--------------------------------------------------------------------------
*/

articleSchema.pre("validate", function () {
  if (this.title) {
    if (!this.slug) {
      this.slug = slugify(this.title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    if (!this.metaTitle) {
      this.metaTitle = this.title;
    }
  }

  if (!this.metaDescription && this.content) {
    this.metaDescription = this.content
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 170);
  }
});

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

articleSchema.index({
  isPublished: 1,
  publishedAt: -1,
});

articleSchema.index({
  isFlash: 1,
  isPublished: 1,
  publishedAt: -1,
});

articleSchema.index({
  district: 1,
  isPublished: 1,
  publishedAt: -1,
});

articleSchema.index({
  category: 1,
  isPublished: 1,
  publishedAt: -1,
});

articleSchema.index({
  reporter: 1,
});

articleSchema.index({
  views: -1,
});

articleSchema.index({
  createdAt: -1,
});

const Article = mongoose.model("Article", articleSchema);

export default Article;
