import { unstable_rethrow } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

/* =========================================================
   TYPES
   ========================================================= */

export type ArticleImage = {
  url: string;
  key: string;
  caption?: string;
};

export type Article = {
  _id: string;
  title: string;
  slug: string;
  content?: string;
  reporter?: string;
  district: string;
  tags?: string[];
  images?: ArticleImage[];
  isPublished: boolean;
  isFlash: boolean;
  views?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Video = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  youtubeUrl: string;
  youtubeVideoId?: string;
  thumbnail?: string;
  reporter?: string;
  district: string;
  tags?: string[];
  isPublished: boolean;
  isFlash: boolean;
  views?: number;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FlashArticle = {
  _id: string;
  title: string;
  slug: string;
  district?: string;
  reporter?: string;
  isPublished: boolean;
  isFlash: boolean;
  publishedAt?: string | null;
  createdAt?: string;
};

export type FlashVideo = {
  _id: string;
  title: string;
  slug: string;
  district?: string;
  reporter?: string;
  isPublished: boolean;
  isFlash: boolean;
  publishedAt?: string | null;
  createdAt?: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ArticlePageData = {
  articles: Article[];
  pagination: Pagination;
};

export type VideoPageData = {
  videos: Video[];
  pagination: Pagination;
};

type ApiResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
};

type ArticleListData = {
  articles: Article[];
  pagination?: Pagination;
};

type VideoListData = {
  videos: Video[];
  pagination?: Pagination;
};

/* =========================================================
   EMPTY PAGINATION
   ========================================================= */

const createEmptyPagination = (
  page: number,
  limit: number
): Pagination => {
  return {
    total: 0,
    page,
    limit,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
};

/* =========================================================
   API FETCH
   ========================================================= */

async function fetchFromApi<T>(
  endpoint: string
): Promise<T | null> {
  try {
    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        `API request failed: ${response.status} ${endpoint}`
      );

      return null;
    }

    const result =
      (await response.json()) as ApiResponse<T>;

    return result.data ?? null;
  } catch (error) {
    unstable_rethrow(error);

    console.error(
      `Unable to fetch ${endpoint}:`,
      error
    );

    return null;
  }
}

/* =========================================================
   FLASH ARTICLES
   ========================================================= */

export async function getFlashArticles(): Promise<
  FlashArticle[]
> {
  const data = await fetchFromApi<
    | FlashArticle[]
    | {
        articles?: FlashArticle[];
      }
  >("/api/articles/flash");

  if (Array.isArray(data)) {
    return data;
  }

  return data?.articles || [];
}

/* =========================================================
   FLASH VIDEOS
   ========================================================= */

export async function getFlashVideos(): Promise<
  FlashVideo[]
> {
  const data = await fetchFromApi<
    | FlashVideo[]
    | {
        videos?: FlashVideo[];
      }
  >("/api/videos/flash");

  if (Array.isArray(data)) {
    return data;
  }

  return data?.videos || [];
}

/* =========================================================
   HOMEPAGE ARTICLES
   ========================================================= */

export async function getPublishedArticles(
  limit = 10
): Promise<Article[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: String(limit),
    sortBy: "publishedAt",
    order: "desc",
  });

  const data =
    await fetchFromApi<ArticleListData>(
      `/api/articles?${params.toString()}`
    );

  return data?.articles || [];
}

/* =========================================================
   HOMEPAGE VIDEOS
   ========================================================= */

export async function getPublishedVideos(
  limit = 10
): Promise<Video[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: String(limit),
    sortBy: "publishedAt",
    order: "desc",
  });

  const data =
    await fetchFromApi<VideoListData>(
      `/api/videos?${params.toString()}`
    );

  return data?.videos || [];
}

/* =========================================================
   PAGINATED WEB NEWS
   ========================================================= */

export async function getPublishedArticlePage({
  page = 1,
  limit = 12,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ArticlePageData> {
  const safePage = Math.max(1, page);

  const safeLimit = Math.max(
    1,
    Math.min(limit, 100)
  );

  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(safeLimit),
    sortBy: "publishedAt",
    order: "desc",
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const data =
    await fetchFromApi<ArticleListData>(
      `/api/articles?${params.toString()}`
    );

  return {
    articles: data?.articles || [],

    pagination:
      data?.pagination ||
      createEmptyPagination(
        safePage,
        safeLimit
      ),
  };
}

/* =========================================================
   PAGINATED VIDEO NEWS
   ========================================================= */

export async function getPublishedVideoPage({
  page = 1,
  limit = 12,
  search = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<VideoPageData> {
  const safePage = Math.max(1, page);

  const safeLimit = Math.max(
    1,
    Math.min(limit, 100)
  );

  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(safeLimit),
    sortBy: "publishedAt",
    order: "desc",
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const data =
    await fetchFromApi<VideoListData>(
      `/api/videos?${params.toString()}`
    );

  return {
    videos: data?.videos || [],

    pagination:
      data?.pagination ||
      createEmptyPagination(
        safePage,
        safeLimit
      ),
  };
}

/* =========================================================
   SINGLE ARTICLE BY SLUG
   ========================================================= */

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  if (!slug.trim()) {
    return null;
  }

  const safeSlug =
    encodeURIComponent(slug.trim());

  return fetchFromApi<Article>(
    `/api/articles/${safeSlug}`
  );
}

/* =========================================================
   SINGLE VIDEO BY SLUG
   ========================================================= */

export async function getVideoBySlug(
  slug: string
): Promise<Video | null> {
  if (!slug.trim()) {
    return null;
  }

  const safeSlug =
    encodeURIComponent(slug.trim());

  return fetchFromApi<Video>(
    `/api/videos/${safeSlug}`
  );
}