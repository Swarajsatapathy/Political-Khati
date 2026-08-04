import type { MetadataRoute } from "next";

import {
  getPublishedArticlePage,
  getPublishedVideoPage,
  type Article,
  type Video,
} from "../lib/api";

export const dynamic = "force-dynamic";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

function getValidDate(
  value?: string | null
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

async function getAllPublishedArticles(): Promise<
  Article[]
> {
  const firstPage =
    await getPublishedArticlePage({
      page: 1,
      limit: 100,
    });

  const totalPages =
    firstPage.pagination.totalPages;

  if (totalPages <= 1) {
    return firstPage.articles;
  }

  const remainingPages = await Promise.all(
    Array.from(
      {
        length: totalPages - 1,
      },
      (_, index) =>
        getPublishedArticlePage({
          page: index + 2,
          limit: 100,
        })
    )
  );

  return [
    ...firstPage.articles,
    ...remainingPages.flatMap(
      (pageData) => pageData.articles
    ),
  ];
}

async function getAllPublishedVideos(): Promise<
  Video[]
> {
  const firstPage =
    await getPublishedVideoPage({
      page: 1,
      limit: 100,
    });

  const totalPages =
    firstPage.pagination.totalPages;

  if (totalPages <= 1) {
    return firstPage.videos;
  }

  const remainingPages = await Promise.all(
    Array.from(
      {
        length: totalPages - 1,
      },
      (_, index) =>
        getPublishedVideoPage({
          page: index + 2,
          limit: 100,
        })
    )
  );

  return [
    ...firstPage.videos,
    ...remainingPages.flatMap(
      (pageData) => pageData.videos
    ),
  ];
}

export default async function sitemap(): Promise<
  MetadataRoute.Sitemap
> {
  const [articles, videos] =
    await Promise.all([
      getAllPublishedArticles(),
      getAllPublishedVideos(),
    ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/web-news`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/video-news`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about-us`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact-us`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const articlePages: MetadataRoute.Sitemap =
    articles.map((article) => ({
      url: `${SITE_URL}/web-news/${article.slug}`,

      lastModified: getValidDate(
        article.updatedAt ||
          article.publishedAt ||
          article.createdAt
      ),

      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const videoPages: MetadataRoute.Sitemap =
    videos.map((video) => ({
      url: `${SITE_URL}/video-news/${video.slug}`,

      lastModified: getValidDate(
        video.updatedAt ||
          video.publishedAt ||
          video.createdAt
      ),

      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...articlePages,
    ...videoPages,
  ];
}