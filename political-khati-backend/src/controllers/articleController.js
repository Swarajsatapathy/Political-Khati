import slugify from "slugify";

import Article from "../models/Article.js";
import DISTRICTS from "../constants/districts.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import {
  uploadToS3,
  deleteFromS3,
} from "../utils/s3Upload.js";

const MAX_ARTICLE_IMAGES = 5;

const allowedSortFields = new Set([
  "publishedAt",
  "createdAt",
  "updatedAt",
  "views",
  "title",
]);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const toBoolean = (value) => {
  return value === true || value === "true";
};

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsedValue = Number.parseInt(
    value,
    10
  );

  if (
    Number.isNaN(parsedValue) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
};

const parseStringArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
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
| Slug Generator
|--------------------------------------------------------------------------
*/

const generateUniqueSlug = async (
  title,
  currentArticleId = null
) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existingArticle =
      await Article.findOne({
        slug,
      });

    if (
      !existingArticle ||
      (currentArticleId &&
        existingArticle._id.toString() ===
          currentArticleId.toString())
    ) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;

    counter++;
  }
};

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const validateRequiredArticleFields = ({
  title,
  reporter,
  district,
}) => {
  const normalizedTitle = String(
    title || ""
  ).trim();

  const normalizedReporter = String(
    reporter || ""
  ).trim();

  const normalizedDistrict = String(
    district || ""
  ).trim();

  if (!normalizedTitle) {
    throw new ApiError(
      400,
      "Article title is required"
    );
  }

  if (!normalizedReporter) {
    throw new ApiError(
      400,
      "Reporter name is required"
    );
  }

  if (!normalizedDistrict) {
    throw new ApiError(
      400,
      "District is required"
    );
  }

  if (
    !DISTRICTS.includes(normalizedDistrict)
  ) {
    throw new ApiError(
      400,
      `${normalizedDistrict} is not a valid district`
    );
  }

  return {
    normalizedTitle,
    normalizedReporter,
    normalizedDistrict,
  };
};

const deleteUploadedImages = async (
  images
) => {
  if (!images.length) return;

  await Promise.allSettled(
    images.map((image) =>
      deleteFromS3(image.key)
    )
  );
};

/*
|--------------------------------------------------------------------------
| CREATE ARTICLE
|--------------------------------------------------------------------------
*/

const createArticle = asyncHandler(
  async (req, res) => {
    const {
      title,
      content,
      reporter,
      district,
      category,
      isPublished,
      isFlash,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = req.body;

    const {
      normalizedTitle,
      normalizedReporter,
      normalizedDistrict,
    } =
      validateRequiredArticleFields({
        title,
        reporter,
        district,
      });

    if (
      req.files?.length >
      MAX_ARTICLE_IMAGES
    ) {
      throw new ApiError(
        400,
        `Maximum ${MAX_ARTICLE_IMAGES} images allowed`
      );
    }

    const uploadedImages = [];

    try {
      if (req.files?.length) {
        for (const file of req.files) {
          const uploaded =
            await uploadToS3(
              file.buffer,
              file.mimetype,
              "articles"
            );

          uploadedImages.push({
            url: uploaded.url,
            key: uploaded.key,
            caption: "",
          });
        }
      }

      const published =
        toBoolean(isPublished);

      const slug =
        await generateUniqueSlug(
          normalizedTitle
        );

      const article =
        await Article.create({
          title: normalizedTitle,

          slug,

          metaTitle:
            metaTitle ||
            normalizedTitle,

          metaDescription:
            metaDescription || "",

          metaKeywords:
            parseStringArray(
              metaKeywords
            ),

          content: content || "",

          reporter:
            normalizedReporter,

          district:
            normalizedDistrict,

          category:
            category || "Politics",

          images: uploadedImages,

          isPublished:
            published,

          isFlash:
            toBoolean(isFlash),

          publishedAt: published
            ? new Date()
            : null,
        });

      return res.status(201).json(
        new ApiResponse(
          201,
          article,
          "Article created successfully"
        )
      );
    } catch (error) {
      await deleteUploadedImages(
        uploadedImages
      );

      throw error;
    }
  }
);

/*
|--------------------------------------------------------------------------
| Shared Article Listing
|--------------------------------------------------------------------------
*/

const getArticleList = async (
  req,
  res,
  { adminRequest = false } = {}
) => {
  const {
    page = 1,
    limit = 20,
    district,
    reporter,
    category,
    flash,
    published,
    search,
    sortBy = "publishedAt",
    order = "desc",
  } = req.query;

  const filter = {};

  /*
  |--------------------------------------------------------------------------
  | Public users can only access published articles
  |--------------------------------------------------------------------------
  */

  if (adminRequest) {
    if (published !== undefined) {
      filter.isPublished = published === "true";
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
    filter.district = district;
  }

  /*
  |--------------------------------------------------------------------------
  | Category Filter
  |--------------------------------------------------------------------------
  */

  if (category) {
    filter.category = category;
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
  | Flash News Filter
  |--------------------------------------------------------------------------
  */

  if (flash !== undefined) {
    filter.isFlash = flash === "true";
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
        category: {
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

  const pageNumber = parsePositiveInteger(
    page,
    1
  );

  const requestedLimit =
    parsePositiveInteger(limit, 20);

  const pageSize = Math.min(
    requestedLimit,
    1000
  );

  /*
  |--------------------------------------------------------------------------
  | Sorting
  |--------------------------------------------------------------------------
  */

  const selectedSortField =
    allowedSortFields.has(sortBy)
      ? sortBy
      : "publishedAt";

  const sortOrder =
    order === "asc" ? 1 : -1;

  /*
  |--------------------------------------------------------------------------
  | Fetch Articles
  |--------------------------------------------------------------------------
  */

  const [articles, total] =
    await Promise.all([
      Article.find(filter)
        .sort({
          [selectedSortField]:
            sortOrder,
          _id: sortOrder,
        })
        .skip(
          (pageNumber - 1) * pageSize
        )
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

          totalPages:
            total === 0
              ? 0
              : Math.ceil(
                  total / pageSize
                ),

          hasNextPage:
            pageNumber * pageSize <
            total,

          hasPreviousPage:
            pageNumber > 1,
        },
      },
      "Articles fetched successfully"
    )
  );
};

/*
|--------------------------------------------------------------------------
| PUBLIC ARTICLES
|--------------------------------------------------------------------------
*/

const getPublishedArticles =
  asyncHandler(async (req, res) => {
    return getArticleList(req, res, {
      adminRequest: false,
    });
  });

/*
|--------------------------------------------------------------------------
| ADMIN ARTICLES
|--------------------------------------------------------------------------
*/

const getAdminArticles =
  asyncHandler(async (req, res) => {
    return getArticleList(req, res, {
      adminRequest: true,
    });
  });

/*
|--------------------------------------------------------------------------
| PUBLIC SINGLE ARTICLE (Slug Based)
|--------------------------------------------------------------------------
*/

const getArticleBySlug =
  asyncHandler(async (req, res) => {
    const article =
      await Article.findOneAndUpdate(
        {
          slug: req.params.slug,
          isPublished: true,
        },
        {
          $inc: {
            views: 1,
          },
        },
        {
          new: true,
        }
      );

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        article
      )
    );
  });

/*
|--------------------------------------------------------------------------
| ADMIN SINGLE ARTICLE
|--------------------------------------------------------------------------
*/

const getAdminArticleById =
  asyncHandler(async (req, res) => {
    const article =
      await Article.findById(
        req.params.id
      );

    if (!article) {
      throw new ApiError(
        404,
        "Article not found"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        article
      )
    );
  });

/*
|--------------------------------------------------------------------------
| FLASH NEWS
|--------------------------------------------------------------------------
*/

const getFlashStories =
  asyncHandler(async (_req, res) => {
    const articles =
      await Article.find({
        isFlash: true,
        isPublished: true,
      })
        .sort({
          publishedAt: -1,
          _id: -1,
        })
        .limit(10)
        .lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        articles,
        "Flash stories fetched successfully"
      )
    );
  });

  /*
|--------------------------------------------------------------------------
| UPDATE ARTICLE
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
    category,
    isPublished,
    isFlash,
    metaTitle,
    metaDescription,
    metaKeywords,
    removeImages,
  } = req.body;

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  if (title !== undefined && !String(title).trim()) {
    throw new ApiError(400, "Article title cannot be empty");
  }

  if (reporter !== undefined && !String(reporter).trim()) {
    throw new ApiError(400, "Reporter name cannot be empty");
  }

  if (district !== undefined) {
    const normalizedDistrict = String(district).trim();

    if (!DISTRICTS.includes(normalizedDistrict)) {
      throw new ApiError(
        400,
        `${normalizedDistrict} is not a valid district`
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Remove Existing Images
  |--------------------------------------------------------------------------
  */

  const requestedKeysToRemove = [
    ...new Set(parseStringArray(removeImages)),
  ];

  const existingKeys = new Set(
    article.images.map((image) => image.key)
  );

  const keysToRemove = requestedKeysToRemove.filter((key) =>
    existingKeys.has(key)
  );

  const remainingImages = article.images.filter(
    (image) => !keysToRemove.includes(image.key)
  );

  /*
  |--------------------------------------------------------------------------
  | Upload New Images
  |--------------------------------------------------------------------------
  */

  const newFiles = req.files || [];

  if (
    remainingImages.length + newFiles.length >
    MAX_ARTICLE_IMAGES
  ) {
    throw new ApiError(
      400,
      `Maximum ${MAX_ARTICLE_IMAGES} images allowed`
    );
  }

  const newlyUploadedImages = [];

  try {
    for (const file of newFiles) {
      const uploaded = await uploadToS3(
        file.buffer,
        file.mimetype,
        "articles"
      );

      newlyUploadedImages.push({
        url: uploaded.url,
        key: uploaded.key,
        caption: "",
      });
    }

    article.images = [
      ...remainingImages,
      ...newlyUploadedImages,
    ];

    /*
    |--------------------------------------------------------------------------
    | Update Fields
    |--------------------------------------------------------------------------
    */

    if (title !== undefined) {
      article.title = String(title).trim();
    }

    if (content !== undefined) {
      article.content = content;
    }

    if (reporter !== undefined) {
      article.reporter = String(reporter).trim();
    }

    if (district !== undefined) {
      article.district = String(district).trim();
    }

    if (category !== undefined) {
      article.category = String(category).trim();
    }

    if (metaTitle !== undefined) {
      article.metaTitle = metaTitle;
    }

    if (metaDescription !== undefined) {
      article.metaDescription = metaDescription;
    }

    if (metaKeywords !== undefined) {
      article.metaKeywords =
        parseStringArray(metaKeywords);
    }

    if (isFlash !== undefined) {
      article.isFlash = toBoolean(isFlash);
    }

    /*
    |--------------------------------------------------------------------------
    | Publish / Draft
    |--------------------------------------------------------------------------
    */

    if (isPublished !== undefined) {
      const nextPublished =
        toBoolean(isPublished);

      if (
        nextPublished &&
        !article.isPublished
      ) {
        article.publishedAt = new Date();
      }

      if (!nextPublished) {
        article.publishedAt = null;
      }

      article.isPublished = nextPublished;
    }

    await article.save();

    /*
    |--------------------------------------------------------------------------
    | Delete Removed Images From S3
    |--------------------------------------------------------------------------
    */

    const deletionResults =
      await Promise.allSettled(
        keysToRemove.map((key) =>
          deleteFromS3(key)
        )
      );

    deletionResults.forEach(
      (result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete image: ${keysToRemove[index]}`,
            result.reason
          );
        }
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        article,
        "Article updated successfully"
      )
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Rollback Newly Uploaded Images
    |--------------------------------------------------------------------------
    */

    await deleteUploadedImages(
      newlyUploadedImages
    );

    throw error;
  }
});

/*
|--------------------------------------------------------------------------
| DELETE ARTICLE
|--------------------------------------------------------------------------
*/

const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  /*
  |--------------------------------------------------------------------------
  | Collect S3 Keys
  |--------------------------------------------------------------------------
  */

  const imageKeys = article.images
    .map((image) => image.key)
    .filter(Boolean);

  /*
  |--------------------------------------------------------------------------
  | Delete From Database
  |--------------------------------------------------------------------------
  */

  await article.deleteOne();

  /*
  |--------------------------------------------------------------------------
  | Delete Images From S3
  |--------------------------------------------------------------------------
  */

  const deletionResults = await Promise.allSettled(
    imageKeys.map((key) => deleteFromS3(key))
  );

  deletionResults.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete S3 image: ${imageKeys[index]}`,
        result.reason
      );
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Article deleted successfully"
    )
  );
});

/*
|--------------------------------------------------------------------------
| EXPORTS
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