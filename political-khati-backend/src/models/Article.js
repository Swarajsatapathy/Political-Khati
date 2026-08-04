import mongoose from "mongoose";
import slugify from "slugify";

import DISTRICTS from "../constants/districts.js";

/*
|--------------------------------------------------------------------------
| Article Image Schema
|--------------------------------------------------------------------------
*/

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },

    key: {
      type: String,
      required: [true, "Image key is required"],
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Article Schema
|--------------------------------------------------------------------------
*/

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: [
        300,
        "Title cannot exceed 300 characters",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | Used for public article URLs
    |--------------------------------------------------------------------------
    */

    slug: {
      type: String,
      required: [true, "Article slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | Optional Reporter
    |--------------------------------------------------------------------------
    */

    reporter: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        150,
        "Reporter name cannot exceed 150 characters",
      ],
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

    /*
    |--------------------------------------------------------------------------
    | Tags entered as comma-separated values in the admin page
    |--------------------------------------------------------------------------
    */

    tags: {
      type: [String],
      default: [],

      set(values) {
        if (!Array.isArray(values)) {
          return [];
        }

        return [
          ...new Set(
            values
              .map((value) =>
                String(value)
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
          ),
        ];
      },
    },

    images: {
      type: [imageSchema],
      default: [],

      validate: {
        validator(images) {
          return images.length <= 5;
        },

        message:
          "A maximum of 5 article images can be stored",
      },
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
      min: [
        0,
        "Views cannot be negative",
      ],
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    collection:
      "political_khati_articles",
  }
);

/*
|--------------------------------------------------------------------------
| Slug and Publishing Defaults
|--------------------------------------------------------------------------
*/

articleSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | Fallback slug generation
    |--------------------------------------------------------------------------
    | The controller normally creates the unique slug.
    */

    if (
      this.title &&
      !this.slug
    ) {
      const generatedSlug =
        slugify(this.title, {
          lower: true,
          strict: true,
          trim: true,
        });

      /*
       * Slugify may return an empty value
       * for an Odia-only title.
       */

      this.slug =
        generatedSlug ||
        `article-${Date.now()}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Published Date
    |--------------------------------------------------------------------------
    */

    if (
      this.isPublished &&
      !this.publishedAt
    ) {
      this.publishedAt =
        new Date();
    }

    if (
      !this.isPublished
    ) {
      this.publishedAt =
        null;
    }
  }
);

/*
|--------------------------------------------------------------------------
| Database Indexes
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
  reporter: 1,
});

articleSchema.index({
  tags: 1,
});

articleSchema.index({
  views: -1,
});

articleSchema.index({
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Article =
  mongoose.models.Article ||
  mongoose.model(
    "Article",
    articleSchema
  );

export default Article;