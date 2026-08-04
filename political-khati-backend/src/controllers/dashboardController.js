import Article from "../models/Article.js";
import Video from "../models/Video.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalArticles,
    publishedArticles,
    draftArticles,

    totalVideos,
    publishedVideos,
    draftVideos,

    articleViews,
    videoViews,
  ] = await Promise.all([
    Article.countDocuments(),

    Article.countDocuments({
      isPublished: true,
    }),

    Article.countDocuments({
      isPublished: false,
    }),

    Video.countDocuments(),

    Video.countDocuments({
      isPublished: true,
    }),

    Video.countDocuments({
      isPublished: false,
    }),

    Article.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$views",
          },
        },
      },
    ]),

    Video.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$views",
          },
        },
      },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: draftArticles,
        },

        videos: {
          total: totalVideos,
          published: publishedVideos,
          draft: draftVideos,
        },

        views: {
          articles: articleViews[0]?.total || 0,
          videos: videoViews[0]?.total || 0,
        },
      },
      "Dashboard statistics fetched successfully"
    )
  );
});

export { getDashboardStats };