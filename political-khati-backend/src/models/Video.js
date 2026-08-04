import mongoose from "mongoose";
import slugify from "slugify";

import DISTRICTS from "../constants/districts.js";

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: [
        300,
        "Video title cannot exceed 300 characters",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | Public URL Slug
    |--------------------------------------------------------------------------
    */

    slug: {
      type: String,
      required: [true, "Video slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Video Description
    |--------------------------------------------------------------------------
    */

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [
        500,
        "Video description cannot exceed 500 characters",
      ],
    },

    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
    },

    youtubeVideoId: {
      type: String,
      required: [true, "YouTube video ID is required"],
      trim: true,
      maxlength: [
        20,
        "Invalid YouTube video ID",
      ],
      index: true,
    },

    thumbnail: {
      type: String,
      required: [true, "Video thumbnail is required"],
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Reporter is Optional
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
    | Tags
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
      "political_khati_videos",
  }
);

/*
|--------------------------------------------------------------------------
| Slug and Publishing Defaults
|--------------------------------------------------------------------------
*/

videoSchema.pre(
  "validate",
  function () {
    /*
    |--------------------------------------------------------------------------
    | Fallback Slug Generator
    |--------------------------------------------------------------------------
    | The controller normally generates the unique slug.
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
       * Use YouTube ID when an Odia-only
       * title does not produce a slug.
       */

      this.slug =
        generatedSlug ||
        `video-${String(
          this.youtubeVideoId ||
            Date.now()
        ).toLowerCase()}`;
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

    if (!this.isPublished) {
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

videoSchema.index({
  isPublished: 1,
  publishedAt: -1,
});

videoSchema.index({
  isFlash: 1,
  isPublished: 1,
  publishedAt: -1,
});

videoSchema.index({
  district: 1,
  isPublished: 1,
  publishedAt: -1,
});

videoSchema.index({
  reporter: 1,
});

videoSchema.index({
  tags: 1,
});

videoSchema.index({
  views: -1,
});

videoSchema.index({
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Video =
  mongoose.models.Video ||
  mongoose.model(
    "Video",
    videoSchema
  );

export default Video;