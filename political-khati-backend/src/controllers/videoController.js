import slugify from "slugify";

import Video from "../models/Video.js";
import DISTRICTS from "../constants/districts.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const MAX_PAGE_SIZE = 100;

const allowedSortFields =
  new Set([
    "publishedAt",
    "createdAt",
    "updatedAt",
    "views",
    "title",
  ]);

/*
|--------------------------------------------------------------------------
| Fields Returned in Listing APIs
|--------------------------------------------------------------------------
*/

const VIDEO_LIST_FIELDS = [
  "title",
  "slug",
  "description",
  "youtubeUrl",
  "youtubeVideoId",
  "thumbnail",
  "reporter",
  "district",
  "tags",
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

const toBoolean = (
  value
) => {
  return (
    value === true ||
    value === "true"
  );
};

const normalizeText = (
  value,
  fallback = ""
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
};

const escapeRegex = (
  value
) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const parsePositiveInteger = (
  value,
  fallback
) => {
  const parsedValue =
    Number.parseInt(
      value,
      10
    );

  if (
    Number.isNaN(
      parsedValue
    ) ||
    parsedValue < 1
  ) {
    return fallback;
  }

  return parsedValue;
};

/*
|--------------------------------------------------------------------------
| Parse Tags
|--------------------------------------------------------------------------
*/

const parseStringArray = (
  value
) => {
  if (!value) {
    return [];
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        String(item).trim()
      )
      .filter(Boolean);
  }

  if (
    typeof value ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
          .map((item) =>
            String(
              item
            ).trim()
          )
          .filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
};

const normalizeTags = (
  value
) => {
  return [
    ...new Set(
      parseStringArray(
        value
      )
        .map((tag) =>
          tag.toLowerCase()
        )
        .filter(Boolean)
    ),
  ];
};

/*
|--------------------------------------------------------------------------
| Temporary Admin Compatibility
|--------------------------------------------------------------------------
| The current admin page sends:
|
| metaDescription instead of description
| metaKeywords instead of tags
|
| These aliases keep the current admin working.
|--------------------------------------------------------------------------
*/

const addLegacyAdminFields = (
  video
) => {
  const data =
    typeof video?.toObject ===
    "function"
      ? video.toObject()
      : video;

  return {
    ...data,

    metaDescription:
      data?.description || "",

    metaKeywords:
      data?.tags || [],
  };
};

/*
|--------------------------------------------------------------------------
| District Validation
|--------------------------------------------------------------------------
*/

const validateDistrict = (
  district
) => {
  const normalizedDistrict =
    normalizeText(
      district
    );

  if (
    !normalizedDistrict
  ) {
    throw new ApiError(
      400,
      "District is required"
    );
  }

  if (
    !DISTRICTS.includes(
      normalizedDistrict
    )
  ) {
    throw new ApiError(
      400,
      `${normalizedDistrict} is not a valid district`
    );
  }

  return normalizedDistrict;
};

/*
|--------------------------------------------------------------------------
| YouTube Helpers
|--------------------------------------------------------------------------
*/

const isValidYouTubeVideoId = (
  videoId
) => {
  return /^[a-zA-Z0-9_-]{11}$/.test(
    videoId || ""
  );
};

const extractVideoId = (
  youtubeUrl
) => {
  const normalizedUrl =
    normalizeText(
      youtubeUrl
    );

  if (!normalizedUrl) {
    return null;
  }

  let parsedUrl;

  try {
    const urlWithProtocol =
      /^https?:\/\//i.test(
        normalizedUrl
      )
        ? normalizedUrl
        : `https://${normalizedUrl}`;

    parsedUrl =
      new URL(
        urlWithProtocol
      );
  } catch {
    return null;
  }

  const hostname =
    parsedUrl.hostname
      .toLowerCase()
      .replace(
        /^www\./,
        ""
      )
      .replace(
        /^m\./,
        ""
      );

  let videoId = null;

  /*
  |--------------------------------------------------------------------------
  | youtu.be/VIDEO_ID
  |--------------------------------------------------------------------------
  */

  if (
    hostname ===
    "youtu.be"
  ) {
    videoId =
      parsedUrl.pathname
        .split("/")
        .filter(
          Boolean
        )[0];
  }

  /*
  |--------------------------------------------------------------------------
  | youtube.com Links
  |--------------------------------------------------------------------------
  */

  const youtubeHosts =
    new Set([
      "youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
    ]);

  if (
    youtubeHosts.has(
      hostname
    )
  ) {
    /*
    |--------------------------------------------------------------------------
    | youtube.com/watch?v=VIDEO_ID
    |--------------------------------------------------------------------------
    */

    if (
      parsedUrl.pathname ===
      "/watch"
    ) {
      videoId =
        parsedUrl.searchParams.get(
          "v"
        );
    } else {
      /*
      |--------------------------------------------------------------------------
      | /shorts/, /embed/ and /live/
      |--------------------------------------------------------------------------
      */

      const pathParts =
        parsedUrl.pathname
          .split("/")
          .filter(
            Boolean
          );

      const supportedPaths =
        new Set([
          "embed",
          "shorts",
          "live",
        ]);

      if (
        supportedPaths.has(
          pathParts[0]
        )
      ) {
        videoId =
          pathParts[1];
      }
    }
  }

  if (
    !isValidYouTubeVideoId(
      videoId
    )
  ) {
    return null;
  }

  return videoId;
};

const getThumbnail = (
  videoId
) => {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
};

/*
|--------------------------------------------------------------------------
| Unique Slug Generator
|--------------------------------------------------------------------------
*/

const generateUniqueSlug =
  async (
    title,
    youtubeVideoId,
    currentVideoId = null
  ) => {
    const generatedSlug =
      slugify(title, {
        lower: true,
        strict: true,
        trim: true,
      });

    /*
     * Use YouTube video ID when the
     * Odia title produces no slug.
     */

    const baseSlug =
      generatedSlug ||
      `video-${String(
        youtubeVideoId
      ).toLowerCase()}`;

    let candidateSlug =
      baseSlug;

    let counter = 2;

    while (true) {
      const filter = {
        slug:
          candidateSlug,
      };

      if (
        currentVideoId
      ) {
        filter._id = {
          $ne:
            currentVideoId,
        };
      }

      const existingVideo =
        await Video.exists(
          filter
        );

      if (
        !existingVideo
      ) {
        return candidateSlug;
      }

      candidateSlug =
        `${baseSlug}-${counter}`;

      counter += 1;
    }
  };

/*
|--------------------------------------------------------------------------
| Required Field Validation
|--------------------------------------------------------------------------
*/

const validateRequiredVideoFields =
  ({
    title,
    youtubeUrl,
    reporter,
    district,
  }) => {
    const normalizedTitle =
      normalizeText(
        title
      );

    const normalizedYoutubeUrl =
      normalizeText(
        youtubeUrl
      );

    const normalizedReporter =
      normalizeText(
        reporter
      );

    const normalizedDistrict =
      validateDistrict(
        district
      );

    if (
      !normalizedTitle
    ) {
      throw new ApiError(
        400,
        "Video title is required"
      );
    }

    if (
      !normalizedYoutubeUrl
    ) {
      throw new ApiError(
        400,
        "YouTube URL is required"
      );
    }

    const youtubeVideoId =
      extractVideoId(
        normalizedYoutubeUrl
      );

    if (
      !youtubeVideoId
    ) {
      throw new ApiError(
        400,
        "Invalid YouTube URL"
      );
    }

    return {
      normalizedTitle,
      normalizedYoutubeUrl,
      normalizedReporter,
      normalizedDistrict,
      youtubeVideoId,
    };
  };

/*
|--------------------------------------------------------------------------
| Create Video
|--------------------------------------------------------------------------
*/

const createVideo =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const {
        title,

        description,
        metaDescription,

        youtubeUrl,
        reporter,
        district,

        tags,
        metaKeywords,

        isPublished,
        isFlash,
      } = req.body;

      const {
        normalizedTitle,
        normalizedYoutubeUrl,
        normalizedReporter,
        normalizedDistrict,
        youtubeVideoId,
      } =
        validateRequiredVideoFields(
          {
            title,
            youtubeUrl,
            reporter,
            district,
          }
        );

      const published =
        toBoolean(
          isPublished
        );

      const slug =
        await generateUniqueSlug(
          normalizedTitle,
          youtubeVideoId
        );

      const video =
        await Video.create({
          title:
            normalizedTitle,

          slug,

          /*
           * New field: description
           * Current admin fallback: metaDescription
           */

          description:
            normalizeText(
              description ??
                metaDescription
            ),

          youtubeUrl:
            normalizedYoutubeUrl,

          youtubeVideoId,

          thumbnail:
            getThumbnail(
              youtubeVideoId
            ),

          reporter:
            normalizedReporter,

          district:
            normalizedDistrict,

          /*
           * New field: tags
           * Current admin fallback: metaKeywords
           */

          tags:
            normalizeTags(
              tags ??
                metaKeywords
            ),

          isPublished:
            published,

          isFlash:
            toBoolean(
              isFlash
            ),

          publishedAt:
            published
              ? new Date()
              : null,
        });

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,

            addLegacyAdminFields(
              video
            ),

            "Video created successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Shared Video Listing
|--------------------------------------------------------------------------
*/

const getVideoList =
  async (
    req,
    res,
    {
      adminRequest = false,
    } = {}
  ) => {
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

    if (
      adminRequest
    ) {
      if (
        published !==
        undefined
      ) {
        filter.isPublished =
          toBoolean(
            published
          );
      }
    } else {
      filter.isPublished =
        true;
    }

    /*
    |--------------------------------------------------------------------------
    | District Filter
    |--------------------------------------------------------------------------
    */

    if (district) {
      filter.district =
        validateDistrict(
          district
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Reporter Filter
    |--------------------------------------------------------------------------
    */

    if (reporter) {
      filter.reporter = {
        $regex:
          escapeRegex(
            reporter
          ),

        $options: "i",
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Flash Filter
    |--------------------------------------------------------------------------
    */

    if (
      flash !==
      undefined
    ) {
      filter.isFlash =
        toBoolean(
          flash
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Tag Filter
    |--------------------------------------------------------------------------
    */

    if (tag) {
      filter.tags =
        normalizeText(
          tag
        ).toLowerCase();
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      const safeSearch =
        escapeRegex(
          search
        );

      filter.$or = [
        {
          title: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },

        {
          description: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },

        {
          reporter: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },

        {
          district: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },

        {
          tags: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },

        {
          youtubeVideoId: {
            $regex:
              safeSearch,

            $options:
              "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const pageNumber =
      parsePositiveInteger(
        page,
        1
      );

    const requestedLimit =
      parsePositiveInteger(
        limit,
        20
      );

    const pageSize =
      Math.min(
        requestedLimit,
        MAX_PAGE_SIZE
      );

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    const selectedSortField =
      allowedSortFields.has(
        sortBy
      )
        ? sortBy
        : "publishedAt";

    const sortOrder =
      order === "asc"
        ? 1
        : -1;

    /*
    |--------------------------------------------------------------------------
    | Fetch Videos
    |--------------------------------------------------------------------------
    */

    const [
      videos,
      total,
    ] =
      await Promise.all([
        Video.find(
          filter
        )
          .select(
            VIDEO_LIST_FIELDS
          )
          .sort({
            [selectedSortField]:
              sortOrder,

            _id:
              sortOrder,
          })
          .skip(
            (pageNumber -
              1) *
              pageSize
          )
          .limit(
            pageSize
          )
          .lean(),

        Video.countDocuments(
          filter
        ),
      ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,

          {
            videos,

            pagination: {
              total,

              page:
                pageNumber,

              limit:
                pageSize,

              totalPages:
                total === 0
                  ? 0
                  : Math.ceil(
                      total /
                        pageSize
                    ),

              hasNextPage:
                pageNumber *
                  pageSize <
                total,

              hasPreviousPage:
                pageNumber >
                1,
            },
          },

          "Videos fetched successfully"
        )
      );
  };

/*
|--------------------------------------------------------------------------
| Public Videos
|--------------------------------------------------------------------------
*/

const getPublishedVideos =
  asyncHandler(
    async (
      req,
      res
    ) => {
      return getVideoList(
        req,
        res,
        {
          adminRequest:
            false,
        }
      );
    }
  );

/*
|--------------------------------------------------------------------------
| Admin Videos
|--------------------------------------------------------------------------
*/

const getAdminVideos =
  asyncHandler(
    async (
      req,
      res
    ) => {
      return getVideoList(
        req,
        res,
        {
          adminRequest:
            true,
        }
      );
    }
  );

/*
|--------------------------------------------------------------------------
| Public Video by Slug
|--------------------------------------------------------------------------
*/

const getVideoBySlug =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const slug =
        normalizeText(
          req.params.slug
        ).toLowerCase();

      const video =
        await Video.findOneAndUpdate(
          {
            slug,

            isPublished:
              true,
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
        throw new ApiError(
          404,
          "Video not found"
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            video,
            "Video fetched successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Admin Video by ID
|--------------------------------------------------------------------------
*/

const getAdminVideoById =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const video =
        await Video.findById(
          req.params.id
        );

      if (!video) {
        throw new ApiError(
          404,
          "Video not found"
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,

            addLegacyAdminFields(
              video
            ),

            "Video fetched successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Update Video
|--------------------------------------------------------------------------
*/

const updateVideo =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const video =
        await Video.findById(
          req.params.id
        );

      if (!video) {
        throw new ApiError(
          404,
          "Video not found"
        );
      }

      const {
        title,

        description,
        metaDescription,

        youtubeUrl,
        reporter,
        district,

        tags,
        metaKeywords,

        isPublished,
        isFlash,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Update Title
      |--------------------------------------------------------------------------
      | Slug is deliberately unchanged so shared links continue working.
      */

      if (
        title !==
        undefined
      ) {
        const normalizedTitle =
          normalizeText(
            title
          );

        if (
          !normalizedTitle
        ) {
          throw new ApiError(
            400,
            "Video title cannot be empty"
          );
        }

        video.title =
          normalizedTitle;
      }

      /*
      |--------------------------------------------------------------------------
      | Update Description
      |--------------------------------------------------------------------------
      */

      if (
        description !==
          undefined ||
        metaDescription !==
          undefined
      ) {
        video.description =
          normalizeText(
            description ??
              metaDescription
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Update YouTube URL
      |--------------------------------------------------------------------------
      */

      if (
        youtubeUrl !==
        undefined
      ) {
        const normalizedYoutubeUrl =
          normalizeText(
            youtubeUrl
          );

        if (
          !normalizedYoutubeUrl
        ) {
          throw new ApiError(
            400,
            "YouTube URL cannot be empty"
          );
        }

        const youtubeVideoId =
          extractVideoId(
            normalizedYoutubeUrl
          );

        if (
          !youtubeVideoId
        ) {
          throw new ApiError(
            400,
            "Invalid YouTube URL"
          );
        }

        video.youtubeUrl =
          normalizedYoutubeUrl;

        video.youtubeVideoId =
          youtubeVideoId;

        video.thumbnail =
          getThumbnail(
            youtubeVideoId
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Optional Reporter
      |--------------------------------------------------------------------------
      */

      if (
        reporter !==
        undefined
      ) {
        video.reporter =
          normalizeText(
            reporter
          );
      }

      /*
      |--------------------------------------------------------------------------
      | District
      |--------------------------------------------------------------------------
      */

      if (
        district !==
        undefined
      ) {
        video.district =
          validateDistrict(
            district
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Tags
      |--------------------------------------------------------------------------
      */

      if (
        tags !==
          undefined ||
        metaKeywords !==
          undefined
      ) {
        video.tags =
          normalizeTags(
            tags ??
              metaKeywords
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Flash
      |--------------------------------------------------------------------------
      */

      if (
        isFlash !==
        undefined
      ) {
        video.isFlash =
          toBoolean(
            isFlash
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Publish or Draft
      |--------------------------------------------------------------------------
      */

      if (
        isPublished !==
        undefined
      ) {
        const nextPublished =
          toBoolean(
            isPublished
          );

        if (
          nextPublished &&
          !video.isPublished
        ) {
          video.publishedAt =
            new Date();
        }

        if (
          !nextPublished
        ) {
          video.publishedAt =
            null;
        }

        video.isPublished =
          nextPublished;
      }

      await video.save();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,

            addLegacyAdminFields(
              video
            ),

            "Video updated successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Delete Video
|--------------------------------------------------------------------------
*/

const deleteVideo =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const video =
        await Video.findById(
          req.params.id
        );

      if (!video) {
        throw new ApiError(
          404,
          "Video not found"
        );
      }

      await video.deleteOne();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "Video deleted successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Flash Videos
|--------------------------------------------------------------------------
*/

const getFlashVideos =
  asyncHandler(
    async (
      _req,
      res
    ) => {
      const videos =
        await Video.find({
          isFlash: true,

          isPublished:
            true,
        })
          .select(
            VIDEO_LIST_FIELDS
          )
          .sort({
            publishedAt:
              -1,

            _id:
              -1,
          })
          .limit(10)
          .lean();

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            videos,
            "Flash videos fetched successfully"
          )
        );
    }
  );

/*
|--------------------------------------------------------------------------
| Exports
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