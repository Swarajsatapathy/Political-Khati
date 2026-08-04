import Video from "../models/Video.js";
import DISTRICTS from "../constants/districts.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const allowedSortFields = new Set([
  "publishedAt",
  "createdAt",
  "updatedAt",
  "views",
  "title",
]);

const toBoolean = (value) => {
  return value === true || value === "true";
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
| Extract YouTube Video ID
|--------------------------------------------------------------------------
*/

const extractVideoId = (url) => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^?]+)/,
    /(?:youtube\.com\/shorts\/)([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return null;
};

const getThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

const validateRequiredVideoFields = ({
  title,
  youtubeUrl,
  reporter,
  district,
}) => {
  const normalizedTitle = String(title || "").trim();
  const normalizedReporter = String(reporter || "").trim();
  const normalizedDistrict = String(district || "").trim();

  if (!normalizedTitle) {
    throw new ApiError(400, "Video title is required");
  }

  if (!youtubeUrl) {
    throw new ApiError(400, "YouTube URL is required");
  }

  if (!normalizedReporter) {
    throw new ApiError(400, "Reporter name is required");
  }

  if (!normalizedDistrict) {
    throw new ApiError(400, "District is required");
  }

  if (!DISTRICTS.includes(normalizedDistrict)) {
    throw new ApiError(
      400,
      `${normalizedDistrict} is not a valid district`
    );
  }

  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    throw new ApiError(400, "Invalid YouTube URL");
  }

  return {
    normalizedTitle,
    normalizedReporter,
    normalizedDistrict,
    videoId,
  };
};

/*
|--------------------------------------------------------------------------
| CREATE VIDEO
|--------------------------------------------------------------------------
*/

const createVideo = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    youtubeUrl,
    reporter,
    district,
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
    videoId,
  } = validateRequiredVideoFields({
    title,
    youtubeUrl,
    reporter,
    district,
  });

  const thumbnail = getThumbnail(videoId);

  const published = toBoolean(isPublished);

  const video = await Video.create({
    title: normalizedTitle,

    category: category || "Politics",

    youtubeUrl,

    youtubeVideoId: videoId,

    thumbnail,

    reporter: normalizedReporter,

    district: normalizedDistrict,

    metaTitle: metaTitle || "",

    metaDescription: metaDescription || "",

    metaKeywords: metaKeywords
      ? Array.isArray(metaKeywords)
        ? metaKeywords
        : String(metaKeywords)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
      : [],

    isPublished: published,

    isFlash: toBoolean(isFlash),

    publishedAt: published ? new Date() : null,
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      video,
      "Video created successfully"
    )
  );
});

/*
|--------------------------------------------------------------------------
| Shared Listing Function
|--------------------------------------------------------------------------
*/

const getVideoList = async (
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

  // Public users only see published videos
  if (adminRequest) {
    if (published !== undefined) {
      filter.isPublished = published === "true";
    }
  } else {
    filter.isPublished = true;
  }

  if (district) {
    filter.district = district;
  }

  if (category) {
    filter.category = category;
  }

  if (reporter) {
    filter.reporter = {
      $regex: escapeRegex(reporter),
      $options: "i",
    };
  }

  if (flash !== undefined) {
    filter.isFlash = flash === "true";
  }

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

  const pageNumber = parsePositiveInteger(page, 1);

  const requestedLimit = parsePositiveInteger(limit, 20);

  const pageSize = Math.min(requestedLimit, 1000);

  const selectedSortField = allowedSortFields.has(sortBy)
    ? sortBy
    : "publishedAt";

  const sortOrder = order === "asc" ? 1 : -1;

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),

    Video.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total,
          page: pageNumber,
          limit: pageSize,
          totalPages:
            total === 0
              ? 0
              : Math.ceil(total / pageSize),
          hasNextPage:
            pageNumber * pageSize < total,
          hasPreviousPage:
            pageNumber > 1,
        },
      },
      "Videos fetched successfully"
    )
  );
};

/*
|--------------------------------------------------------------------------
| PUBLIC: GET PUBLISHED VIDEOS
|--------------------------------------------------------------------------
*/

const getPublishedVideos = asyncHandler(async (req, res) => {
  return getVideoList(req, res, {
    adminRequest: false,
  });
});

/*
|--------------------------------------------------------------------------
| ADMIN: GET ALL VIDEOS
|--------------------------------------------------------------------------
*/

const getAdminVideos = asyncHandler(async (req, res) => {
  return getVideoList(req, res, {
    adminRequest: true,
  });
});

/*
|--------------------------------------------------------------------------
| PUBLIC: GET VIDEO BY SLUG
|--------------------------------------------------------------------------
*/

const getVideoBySlug = asyncHandler(async (req, res) => {
  const video = await Video.findOneAndUpdate(
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

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video));
});

/*
|--------------------------------------------------------------------------
| ADMIN: GET VIDEO BY ID
|--------------------------------------------------------------------------
*/

const getAdminVideoById = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video));
});

/*
|--------------------------------------------------------------------------
| UPDATE VIDEO
|--------------------------------------------------------------------------
*/

const updateVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const {
    title,
    category,
    youtubeUrl,
    reporter,
    district,
    isPublished,
    isFlash,
    metaTitle,
    metaDescription,
    metaKeywords,
  } = req.body;

  if (title !== undefined) {
    const normalizedTitle = String(title).trim();

    if (!normalizedTitle) {
      throw new ApiError(400, "Video title cannot be empty");
    }

    video.title = normalizedTitle;
  }

  if (category !== undefined) {
    video.category = String(category).trim();
  }

  if (youtubeUrl !== undefined) {
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      throw new ApiError(400, "Invalid YouTube URL");
    }

    video.youtubeUrl = youtubeUrl;
    video.youtubeVideoId = videoId;
    video.thumbnail = getThumbnail(videoId);
  }

  if (reporter !== undefined) {
    const normalizedReporter = String(reporter).trim();

    if (!normalizedReporter) {
      throw new ApiError(400, "Reporter name cannot be empty");
    }

    video.reporter = normalizedReporter;
  }

  if (district !== undefined) {
    const normalizedDistrict = String(district).trim();

    if (!DISTRICTS.includes(normalizedDistrict)) {
      throw new ApiError(
        400,
        `${normalizedDistrict} is not a valid district`
      );
    }

    video.district = normalizedDistrict;
  }

  if (metaTitle !== undefined) {
    video.metaTitle = metaTitle;
  }

  if (metaDescription !== undefined) {
    video.metaDescription = metaDescription;
  }

  if (metaKeywords !== undefined) {
    video.metaKeywords = Array.isArray(metaKeywords)
      ? metaKeywords
      : String(metaKeywords)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
  }

  if (isFlash !== undefined) {
    video.isFlash = toBoolean(isFlash);
  }

  if (isPublished !== undefined) {
    const published = toBoolean(isPublished);

    if (published && !video.isPublished) {
      video.publishedAt = new Date();
    }

    if (!published) {
      video.publishedAt = null;
    }

    video.isPublished = published;
  }

  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      video,
      "Video updated successfully"
    )
  );
});

/*
|--------------------------------------------------------------------------
| DELETE VIDEO
|--------------------------------------------------------------------------
*/

const deleteVideo = asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await video.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Video deleted successfully"
    )
  );
});

/*
|--------------------------------------------------------------------------
| PUBLIC: GET FLASH VIDEOS
|--------------------------------------------------------------------------
*/

const getFlashVideos = asyncHandler(async (_req, res) => {
  const videos = await Video.find({
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
      videos,
      "Flash videos fetched successfully"
    )
  );
});

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export {
  createVideo,
  getPublishedVideos,
  getAdminVideos,
  getVideoBySlug,
  getAdminVideoById,
  updateVideo,
  deleteVideo,
  getFlashVideos,
};