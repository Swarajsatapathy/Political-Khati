import type { Metadata } from "next";
import Link from "next/link";

import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaPlay,
  FaVideo,
} from "react-icons/fa6";

import FlashNewsBar from "../../components/FlashNewsBar";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import SocialSidebar from "../../components/SocialSidebar";

import {
  getFlashArticles,
  getPublishedVideoPage,
  type Video,
} from "../../lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video News",

  description:
    "Watch the latest political videos, interviews and important video news from Political Khati.",
};

type VideoNewsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
};

function parsePageNumber(value?: string) {
  const page = Number.parseInt(value || "1", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createPageUrl({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (search) {
    params.set("search", search);
  }

  const queryString = params.toString();

  return queryString
    ? `/video-news?${queryString}`
    : "/video-news";
}

function VideoCard({
  video,
}: {
  video: Video;
}) {
  return (
    <article className="listingNewsCard videoListingCard">
      <Link
        href={`/video-news/${video.slug}`}
        className="listingNewsImageWrapper"
      >
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="listingNewsImage"
          />
        ) : (
          <div className="listingImageFallback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/political-khati-logo.png"
              alt="Political Khati"
            />
          </div>
        )}

        <span className="listingVideoPlayButton">
          <FaPlay />
        </span>

        {video.isFlash && (
          <span className="listingFlashBadge">
            Flash
          </span>
        )}
      </Link>

      <div className="listingNewsBody">
        <div className="listingNewsMeta">
          <span className="listingDistrict">
            {video.district}
          </span>

          {video.reporter && (
            <>
              <span>•</span>
              <span>{video.reporter}</span>
            </>
          )}

          {(video.publishedAt ||
            video.createdAt) && (
            <>
              <span>•</span>

              <time>
                {formatDate(
                  video.publishedAt ||
                    video.createdAt
                )}
              </time>
            </>
          )}
        </div>

        <h2 className="listingNewsTitle">
          <Link
            href={`/video-news/${video.slug}`}
          >
            {video.title}
          </Link>
        </h2>

        {video.description && (
          <p className="listingVideoDescription">
            {video.description}
          </p>
        )}

        {video.tags &&
          video.tags.length > 0 && (
            <div className="listingTags">
              {video.tags
                .slice(0, 3)
                .map((tag) => (
                  <span key={tag}>
                    {tag}
                  </span>
                ))}
            </div>
          )}

        <Link
          href={`/video-news/${video.slug}`}
          className="listingReadMore"
        >
          Watch Video
          <FaArrowRight />
        </Link>
      </div>
    </article>
  );
}

export default async function VideoNewsPage({
  searchParams,
}: VideoNewsPageProps) {
  const resolvedSearchParams =
    await searchParams;

  const currentPage = parsePageNumber(
    resolvedSearchParams.page
  );

  const search =
    resolvedSearchParams.search?.trim() ||
    "";

  const [flashArticles, videoData] =
    await Promise.all([
      getFlashArticles(),

      getPublishedVideoPage({
        page: currentPage,
        limit: 12,
        search,
      }),
    ]);

  const {
    videos,
    pagination,
  } = videoData;

  return (
    <>
      <Header />

      <FlashNewsBar
        articles={flashArticles}
      />

      <SocialSidebar />

      <main className="newsListingPage">
        <section className="listingPageHero videoListingHero">
          <div className="siteContainer">
            <p className="listingPageEyebrow">
              POLITICAL KHATI
            </p>

            <h1>Video News</h1>

            <p>
              Watch political updates,
              interviews, reports and
              important video news from
              Odisha and beyond.
            </p>
          </div>
        </section>

        <section className="listingContentSection">
          <div className="siteContainer">
            <div className="listingToolbar">
              <div>
                <h2>
                  Latest Video News
                </h2>

                <p>
                  {pagination.total}{" "}
                  {pagination.total === 1
                    ? "video"
                    : "videos"}
                </p>
              </div>

              <form
                className="listingSearchForm"
                action="/video-news"
                method="GET"
              >
                <div className="listingSearchInputWrapper">
                  <FaMagnifyingGlass />

                  <input
                    type="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Search video news"
                    aria-label="Search video news"
                  />
                </div>

                <button type="submit">
                  Search
                </button>

                {search && (
                  <Link
                    href="/video-news"
                    className="clearSearchButton"
                  >
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {search && (
              <div className="searchResultNotice">
                Showing results for:
                <strong>
                  “{search}”
                </strong>
              </div>
            )}

            {videos.length > 0 ? (
              <div className="webNewsListingGrid">
                {videos.map((video) => (
                  <VideoCard
                    video={video}
                    key={video._id}
                  />
                ))}
              </div>
            ) : (
              <div className="listingEmptyState">
                <FaVideo />

                <h2>
                  No video news found
                </h2>

                <p>
                  {search
                    ? "Try another search term or clear the current search."
                    : "Published video news will appear here."}
                </p>

                {search && (
                  <Link href="/video-news">
                    View All Video News
                  </Link>
                )}
              </div>
            )}

            {pagination.totalPages >
              1 && (
              <nav
                className="listingPagination"
                aria-label="Video news pagination"
              >
                {pagination.hasPreviousPage ? (
                  <Link
                    href={createPageUrl({
                      page:
                        currentPage - 1,
                      search,
                    })}
                    className="paginationNavigationButton"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="paginationNavigationButton disabled">
                    Previous
                  </span>
                )}

                <div className="paginationNumbers">
                  {Array.from(
                    {
                      length:
                        pagination.totalPages,
                    },
                    (_, index) =>
                      index + 1
                  )
                    .filter((pageNumber) => {
                      return (
                        pageNumber === 1 ||
                        pageNumber ===
                          pagination.totalPages ||
                        Math.abs(
                          pageNumber -
                            currentPage
                        ) <= 1
                      );
                    })
                    .map(
                      (
                        pageNumber,
                        index,
                        filteredPages
                      ) => {
                        const previousPage =
                          filteredPages[
                            index - 1
                          ];

                        const showDots =
                          previousPage &&
                          pageNumber -
                            previousPage >
                            1;

                        return (
                          <span
                            key={
                              pageNumber
                            }
                            className="paginationNumberGroup"
                          >
                            {showDots && (
                              <span className="paginationDots">
                                …
                              </span>
                            )}

                            <Link
                              href={createPageUrl(
                                {
                                  page:
                                    pageNumber,
                                  search,
                                }
                              )}
                              className={
                                pageNumber ===
                                currentPage
                                  ? "paginationNumber active"
                                  : "paginationNumber"
                              }
                            >
                              {
                                pageNumber
                              }
                            </Link>
                          </span>
                        );
                      }
                    )}
                </div>

                {pagination.hasNextPage ? (
                  <Link
                    href={createPageUrl({
                      page:
                        currentPage + 1,
                      search,
                    })}
                    className="paginationNavigationButton"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="paginationNavigationButton disabled">
                    Next
                  </span>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}