import type { Metadata } from "next";
import Link from "next/link";

import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaRegNewspaper,
} from "react-icons/fa6";

import FlashNewsBar from "../../components/FlashNewsBar";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import SocialSidebar from "../../components/SocialSidebar";

import {
  getFlashArticles,
  getPublishedArticlePage,
  type Article,
} from "../../lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Web News",
  description:
    "Read the latest political and public-interest web news from Political Khati.",
};

type WebNewsPageProps = {
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
    ? `/web-news?${queryString}`
    : "/web-news";
}

function ArticleCard({
  article,
}: {
  article: Article;
}) {
  const articleImage =
    article.images?.[0]?.url;

  return (
    <article className="listingNewsCard">
      <Link
        href={`/web-news/${article.slug}`}
        className="listingNewsImageWrapper"
      >
        {articleImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={articleImage}
            alt={article.title}
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

        {article.isFlash && (
          <span className="listingFlashBadge">
            Flash
          </span>
        )}
      </Link>

      <div className="listingNewsBody">
        <div className="listingNewsMeta">
          <span className="listingDistrict">
            {article.district}
          </span>

          {article.reporter && (
            <>
              <span>•</span>
              <span>{article.reporter}</span>
            </>
          )}

          {(article.publishedAt ||
            article.createdAt) && (
            <>
              <span>•</span>

              <time>
                {formatDate(
                  article.publishedAt ||
                    article.createdAt
                )}
              </time>
            </>
          )}
        </div>

        <h2 className="listingNewsTitle">
          <Link
            href={`/web-news/${article.slug}`}
          >
            {article.title}
          </Link>
        </h2>

        {article.tags &&
          article.tags.length > 0 && (
            <div className="listingTags">
              {article.tags
                .slice(0, 3)
                .map((tag) => (
                  <span key={tag}>
                    {tag}
                  </span>
                ))}
            </div>
          )}

        <Link
          href={`/web-news/${article.slug}`}
          className="listingReadMore"
        >
          Read Full News
          <FaArrowRight />
        </Link>
      </div>
    </article>
  );
}

export default async function WebNewsPage({
  searchParams,
}: WebNewsPageProps) {
  const resolvedSearchParams =
    await searchParams;

  const currentPage = parsePageNumber(
    resolvedSearchParams.page
  );

  const search =
    resolvedSearchParams.search?.trim() ||
    "";

  const [flashArticles, articleData] =
    await Promise.all([
      getFlashArticles(),

      getPublishedArticlePage({
        page: currentPage,
        limit: 12,
        search,
      }),
    ]);

  const {
    articles,
    pagination,
  } = articleData;

  return (
    <>
      <Header />

      <FlashNewsBar
        articles={flashArticles}
      />

      <SocialSidebar />

      <main className="newsListingPage">
        <section className="listingPageHero">
          <div className="siteContainer">
            <p className="listingPageEyebrow">
              POLITICAL KHATI
            </p>

            <h1>Web News</h1>

            <p>
              Latest political news,
              public issues and important
              developments from Odisha
              and beyond.
            </p>
          </div>
        </section>

        <section className="listingContentSection">
          <div className="siteContainer">
            <div className="listingToolbar">
              <div>
                <h2>
                  Latest Web News
                </h2>

                <p>
                  {pagination.total}{" "}
                  {pagination.total === 1
                    ? "article"
                    : "articles"}
                </p>
              </div>

              <form
                className="listingSearchForm"
                action="/web-news"
                method="GET"
              >
                <div className="listingSearchInputWrapper">
                  <FaMagnifyingGlass />

                  <input
                    type="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Search web news"
                    aria-label="Search web news"
                  />
                </div>

                <button type="submit">
                  Search
                </button>

                {search && (
                  <Link
                    href="/web-news"
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

            {articles.length > 0 ? (
              <div className="webNewsListingGrid">
                {articles.map(
                  (article) => (
                    <ArticleCard
                      article={article}
                      key={article._id}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="listingEmptyState">
                <FaRegNewspaper />

                <h2>
                  No web news found
                </h2>

                <p>
                  {search
                    ? "Try another search term or clear the current search."
                    : "Published articles will appear here."}
                </p>

                {search && (
                  <Link href="/web-news">
                    View All Web News
                  </Link>
                )}
              </div>
            )}

            {pagination.totalPages >
              1 && (
              <nav
                className="listingPagination"
                aria-label="Web news pagination"
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