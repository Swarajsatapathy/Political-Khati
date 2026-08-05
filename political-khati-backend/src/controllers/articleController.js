import slugify from "slugify";

import Article from "../models/Article.js";
import DISTRICTS from "../constants/districts.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import { uploadToS3, deleteFromS3 } from "../utils/s3Upload.js";

const MAX_ARTICLE_IMAGES = 5;
const MAX_PAGE_SIZE = 100;

const allowedSortFields = new Set([
  "publishedAt",
  "createdAt",
  "updatedAt",
  "views",
  "title",
]);

/*
|--------------------------------------------------------------------------
| Fields Returned by Article Listing APIs
|--------------------------------------------------------------------------
| The complete content is only returned by the single article endpoints.
*/

const ARTICLE_LIST_FIELDS = [
  "title",
  "slug",
  "reporter",
  "district",
  "tags",
  "images",
  "isPublished",
  "isFlash",
  "views",
  "publishedAt",
  "createdAt",
  "updatedAt",
].join(" ");

/*
|--------------------------------------------------------------------------
| General Helpers
|--------------------------------------------------------------------------
*/

const toBoolean = (value) => {
  return value === true || value === "true";
};

const normalizeText = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return fallback;
  }

  return String(value).trim();
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parsePositiveInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
};

/*
|--------------------------------------------------------------------------
| Parse Comma-Separated or JSON Array Values
|--------------------------------------------------------------------------
*/

const parseStringArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

/*
|--------------------------------------------------------------------------
| Temporary Admin Compatibility
|--------------------------------------------------------------------------
| Your current admin page sends and reads metaKeywords.
| Internally, the new backend stores these values as tags.
*/

const addLegacyTagField = (article) => {
  const data =
    typeof article?.toObject === "function" ? article.toObject() : article;

  return {
    ...data,

    metaKeywords: data?.tags || [],
  };
};

const normalizeTags = (tags) => {
  return [
    ...new Set(
      parseStringArray(tags)
        .map((tag) => tag.toLowerCase())
        .filter(Boolean),
    ),
  ];
};

/*
|--------------------------------------------------------------------------
| District Validation
|--------------------------------------------------------------------------
*/

const validateDistrict = (district) => {
  const normalizedDistrict = normalizeText(district);

  if (!normalizedDistrict) {
    throw new ApiError(400, "District is required");
  }

  if (!DISTRICTS.includes(normalizedDistrict)) {
    throw new ApiError(400, `${normalizedDistrict} is not a valid district`);
  }

  return normalizedDistrict;
};

/*
|--------------------------------------------------------------------------
| Unique Slug Generator
|--------------------------------------------------------------------------
*/

const generateUniqueSlug = async (title, currentArticleId = null) => {
  const generatedSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  /*
    |--------------------------------------------------------------------------
    | Fallback for Odia-only titles
    |--------------------------------------------------------------------------
    */

  const baseSlug = generatedSlug || `article-${Date.now()}`;

  let candidateSlug = baseSlug;

  let counter = 2;

  while (true) {
    const filter = {
      slug: candidateSlug,
    };

    if (currentArticleId) {
      filter._id = {
        $ne: currentArticleId,
      };
    }

    const existingArticle = await Article.exists(filter);

    if (!existingArticle) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;

    counter += 1;
  }
};

/*
|--------------------------------------------------------------------------
| Delete Uploaded Images
|--------------------------------------------------------------------------
*/

const deleteUploadedImages = async (images = []) => {
  const imageKeys = images.map((image) => image?.key).filter(Boolean);

  if (!imageKeys.length) {
    return;
  }

  const results = await Promise.allSettled(
    imageKeys.map((key) => deleteFromS3(key)),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete uploaded image: ${imageKeys[index]}`,
        result.reason,
      );
    }
  });
};

/*
|--------------------------------------------------------------------------
| Create Article
|--------------------------------------------------------------------------
*/

const createArticle = asyncHandler(async (req, res) => {
  const {
    title,
    content,
    reporter,
    district,

    /*
     * tags is the new field.
     * metaKeywords keeps the current admin page compatible.
     */

    tags,
    metaKeywords,

    isPublished,
    isFlash,
  } = req.body;

  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle) {
    throw new ApiError(400, "Article title is required");
  }

  const normalizedDistrict = validateDistrict(district);

  const files = req.files || [];

  if (files.length > MAX_ARTICLE_IMAGES) {
    throw new ApiError(400, `Maximum ${MAX_ARTICLE_IMAGES} images allowed`);
  }

  const uploadedImages = [];

  try {
    /*
        |--------------------------------------------------------------------------
        | Upload Images
        |--------------------------------------------------------------------------
        */

    for (const file of files) {
      const uploaded = await uploadToS3(file.buffer, file.mimetype, "articles");

      uploadedImages.push({
        url: uploaded.url,

        key: uploaded.key,
      });
    }

    const published = toBoolean(isPublished);

    const slug = await generateUniqueSlug(normalizedTitle);

    const article = await Article.create({
      title: normalizedTitle,

      slug,

      content: content ?? "",

      reporter: normalizeText(reporter),

      district: normalizedDistrict,

      tags: normalizeTags(tags ?? metaKeywords),

      images: uploadedImages,

      isPublished: published,

      isFlash: toBoolean(isFlash),

      publishedAt: published ? new Date() : null,
    });

    return res.status(201).json(
      new ApiResponse(
        201,

        addLegacyTagField(article),

        "Article created successfully",
      ),
    );
  } catch (error) {
    /*
        |--------------------------------------------------------------------------
        | Remove Uploaded Images if Database Creation Fails
        |--------------------------------------------------------------------------
        */

    await deleteUploadedImages(uploadedImages);

    throw error;
  }
});

/*
|--------------------------------------------------------------------------
| Shared Article Listing
|--------------------------------------------------------------------------
*/

const getArticleList = async (req, res, { adminRequest = false } = {}) => {
  const {
    page = 1,
    limit = 20,
    district,
    reporter,
    flash,
    published,
    tag,
    search,
    sortBy = "publishedAt",
    order = "desc",
  } = req.query;

  const filter = {};

  /*
    |--------------------------------------------------------------------------
    | Publication Filter
    |--------------------------------------------------------------------------
    */

  if (adminRequest) {
    if (published !== undefined) {
      filter.isPublished = toBoolean(published);
    }
  } else {
    filter.isPublished = true;
  }

  /*
    |--------------------------------------------------------------------------
    | District Filter
    |--------------------------------------------------------------------------
    */

  if (district) {
    filter.district = validateDistrict(district);
  }

  /*
    |--------------------------------------------------------------------------
    | Reporter Filter
    |--------------------------------------------------------------------------
    */

  if (reporter) {
    filter.reporter = {
      $regex: escapeRegex(reporter),

      $options: "i",
    };
  }

  /*
    |--------------------------------------------------------------------------
    | Flash Filter
    |--------------------------------------------------------------------------
    */

  if (flash !== undefined) {
    filter.isFlash = toBoolean(flash);
  }

  /*
    |--------------------------------------------------------------------------
    | Tag Filter
    |--------------------------------------------------------------------------
    */

  if (tag) {
    filter.tags = normalizeText(tag).toLowerCase();
  }

  /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

  if (search) {
    const safeSearch = escapeRegex(search);

    filter.$or = [
      {
        title: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        content: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        reporter: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        district: {
          $regex: safeSearch,

          $options: "i",
        },
      },

      {
        tags: {
          $regex: safeSearch,

          $options: "i",
        },
      },
    ];
  }

  /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

  const pageNumber = parsePositiveInteger(page, 1);

  const requestedLimit = parsePositiveInteger(limit, 20);

  const pageSize = Math.min(requestedLimit, MAX_PAGE_SIZE);

  /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

  const selectedSortField = allowedSortFields.has(sortBy)
    ? sortBy
    : "publishedAt";

  const sortOrder = order === "asc" ? 1 : -1;

  /*
    |--------------------------------------------------------------------------
    | Fetch Articles
    |--------------------------------------------------------------------------
    */

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select(ARTICLE_LIST_FIELDS)
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),

    Article.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        articles,

        pagination: {
          total,

          page: pageNumber,

          limit: pageSize,

          totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),

          hasNextPage: pageNumber * pageSize < total,

          hasPreviousPage: pageNumber > 1,
        },
      },

      "Articles fetched successfully",
    ),
  );
};

/*
|--------------------------------------------------------------------------
| Public Published Articles
|--------------------------------------------------------------------------
*/

const getPublishedArticles = asyncHandler(async (req, res) => {
  return getArticleList(req, res, {
    adminRequest: false,
  });
});

/*
|--------------------------------------------------------------------------
| Admin Articles
|--------------------------------------------------------------------------
*/

const getAdminArticles = asyncHandler(async (req, res) => {
  return getArticleList(req, res, {
    adminRequest: true,
  });
});

/*
|--------------------------------------------------------------------------
| Public Single Article by Slug
|--------------------------------------------------------------------------
*/

const getArticleBySlug = asyncHandler(async (req, res) => {
  const slug = normalizeText(req.params.slug).toLowerCase();

  const article = await Article.findOneAndUpdate(
    {
      slug,

      isPublished: true,
    },

    {
      $inc: {
        views: 1,
      },
    },

    {
      returnDocument: "after",
    },
  );

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, article, "Article fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Admin Single Article by ID
|--------------------------------------------------------------------------
*/

const getAdminArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,

      addLegacyTagField(article),

      "Article fetched successfully",
    ),
  );
});

/*
|--------------------------------------------------------------------------
| Flash Articles
|--------------------------------------------------------------------------
*/

const getFlashStories = asyncHandler(async (_req, res) => {
  const articles = await Article.find({
    isFlash: true,

    isPublished: true,
  })
    .select(ARTICLE_LIST_FIELDS)
    .sort({
      publishedAt: -1,

      _id: -1,
    })
    .limit(10)
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, articles, "Flash stories fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Update Article
|--------------------------------------------------------------------------
*/

const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  const {
    title,
    content,
    reporter,
    district,

    tags,
    metaKeywords,

    isPublished,
    isFlash,
    removeImages,
  } = req.body;

  /*
      |--------------------------------------------------------------------------
      | Basic Validation
      |--------------------------------------------------------------------------
      */

  if (title !== undefined && !normalizeText(title)) {
    throw new ApiError(400, "Article title cannot be empty");
  }

  if (district !== undefined) {
    validateDistrict(district);
  }

  /*
      |--------------------------------------------------------------------------
      | Existing Images to Remove
      |--------------------------------------------------------------------------
      */

  const requestedKeysToRemove = [...new Set(parseStringArray(removeImages))];

  const existingKeys = new Set(article.images.map((image) => image.key));

  const keysToRemove = requestedKeysToRemove.filter((key) =>
    existingKeys.has(key),
  );

  const remainingImages = article.images.filter(
    (image) => !keysToRemove.includes(image.key),
  );

  /*
      |--------------------------------------------------------------------------
      | New Images
      |--------------------------------------------------------------------------
      */

  const newFiles = req.files || [];

  if (remainingImages.length + newFiles.length > MAX_ARTICLE_IMAGES) {
    throw new ApiError(400, `Maximum ${MAX_ARTICLE_IMAGES} images allowed`);
  }

  const newlyUploadedImages = [];

  try {
    /*
        |--------------------------------------------------------------------------
        | Upload New Images
        |--------------------------------------------------------------------------
        */

    for (const file of newFiles) {
      const uploaded = await uploadToS3(file.buffer, file.mimetype, "articles");

      newlyUploadedImages.push({
        url: uploaded.url,

        key: uploaded.key,
      });
    }

    article.images = [...remainingImages, ...newlyUploadedImages];

    /*
        |--------------------------------------------------------------------------
        | Update Fields
        |--------------------------------------------------------------------------
        */

    if (title !== undefined) {
      article.title = normalizeText(title);
    }

    if (content !== undefined) {
      article.content = content ?? "";
    }

    if (reporter !== undefined) {
      article.reporter = normalizeText(reporter);
    }

    if (district !== undefined) {
      article.district = validateDistrict(district);
    }

    /*
        |--------------------------------------------------------------------------
        | Update Tags
        |--------------------------------------------------------------------------
        */

    if (tags !== undefined || metaKeywords !== undefined) {
      article.tags = normalizeTags(tags ?? metaKeywords);
    }

    if (isFlash !== undefined) {
      article.isFlash = toBoolean(isFlash);
    }

    /*
        |--------------------------------------------------------------------------
        | Publish or Draft
        |--------------------------------------------------------------------------
        */

    if (isPublished !== undefined) {
      const nextPublished = toBoolean(isPublished);

      if (nextPublished && !article.isPublished) {
        article.publishedAt = new Date();
      }

      if (!nextPublished) {
        article.publishedAt = null;
      }

      article.isPublished = nextPublished;
    }

    /*
        |--------------------------------------------------------------------------
        | Save Article
        |--------------------------------------------------------------------------
        */

    await article.save();

    /*
        |--------------------------------------------------------------------------
        | Delete Removed Images from S3
        |--------------------------------------------------------------------------
        | Images are removed only after the database update succeeds.
        */

    const deletionResults = await Promise.allSettled(
      keysToRemove.map((key) => deleteFromS3(key)),
    );

    deletionResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete image: ${keysToRemove[index]}`,
          result.reason,
        );
      }
    });

    return res.status(200).json(
      new ApiResponse(
        200,

        addLegacyTagField(article),

        "Article updated successfully",
      ),
    );
  } catch (error) {
    /*
        |--------------------------------------------------------------------------
        | Roll Back Newly Uploaded Images
        |--------------------------------------------------------------------------
        */

    await deleteUploadedImages(newlyUploadedImages);

    throw error;
  }
});

/*
|--------------------------------------------------------------------------
| Delete Article
|--------------------------------------------------------------------------
*/

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  const imageKeys = article.images.map((image) => image.key).filter(Boolean);

  /*
      |--------------------------------------------------------------------------
      | Delete Article from MongoDB
      |--------------------------------------------------------------------------
      */

  await article.deleteOne();

  /*
      |--------------------------------------------------------------------------
      | Delete Article Images from S3
      |--------------------------------------------------------------------------
      */

  const deletionResults = await Promise.allSettled(
    imageKeys.map((key) => deleteFromS3(key)),
  );

  deletionResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete S3 image: ${imageKeys[index]}`,
        result.reason,
      );
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Article deleted successfully"));
});

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

export {
  createArticle,
  getPublishedArticles,
  getAdminArticles,
  getArticleBySlug,
  getAdminArticleById,
  updateArticle,
  deleteArticle,
  getFlashStories,
};
