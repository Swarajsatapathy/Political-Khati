import type { Metadata } from "next";

import Link from "next/link";

import { notFound } from "next/navigation";

import {
  FaArrowLeft,
  FaCalendarDays,
  FaEye,
  FaLocationDot,
  FaRegNewspaper,
  FaUserPen,
} from "react-icons/fa6";

import FlashNewsBar from "../../../components/FlashNewsBar";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import ShareButtons from "../../../components/ShareButtons";
import SocialSidebar from "../../../components/SocialSidebar";

import {
  getArticleBySlug,
  getFlashArticles,
} from "../../../lib/api";

export const dynamic =
  "force-dynamic";

type ArticleDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function createDescription(
  content?: string
) {
  if (!content) {
    return "Read the latest political news and updates from Political Khati.";
  }

  const plainContent = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    plainContent.length <= 160
  ) {
    return plainContent;
  }

  return `${plainContent.slice(
    0,
    157
  )}...`;
}

function formatArticleDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function createContentParagraphs(
  content?: string
) {
  if (!content) {
    return [];
  }

  return content
    .split(/\n+/)
    .map((paragraph) =>
      paragraph.trim()
    )
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: ArticleDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;

  const article =
    await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
      description:
        "The requested Political Khati article could not be found.",
    };
  }

  const description =
    createDescription(
      article.content
    );

  const articleImage =
    article.images?.[0]?.url ||
    "/political-khati-logo.png";

  const publishedTime =
    article.publishedAt ||
    article.createdAt;

  return {
    title: article.title,
    description,

    alternates: {
      canonical: `/web-news/${article.slug}`,
    },

    openGraph: {
      title: article.title,
      description,
      url: `/web-news/${article.slug}`,
      siteName: "Political Khati",
      type: "article",
      publishedTime:
        publishedTime || undefined,
      modifiedTime:
        article.updatedAt ||
        undefined,
      images: [
        {
          url: articleImage,
          width: 1920,
          height: 1080,
          alt: article.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [articleImage],
    },
  };
}

export default async function ArticleDetailsPage({
  params,
}: ArticleDetailsPageProps) {
  const { slug } = await params;

  const [
    article,
    flashArticles,
  ] = await Promise.all([
    getArticleBySlug(slug),
    getFlashArticles(),
  ]);

  if (
    !article ||
    article.isPublished === false
  ) {
    notFound();
  }

  const mainImage =
    article.images?.[0];

  const additionalImages =
    article.images?.slice(1) ||
    [];

  const contentParagraphs =
    createContentParagraphs(
      article.content
    );

  const articleDate =
    formatArticleDate(
      article.publishedAt ||
        article.createdAt
    );

  return (
    <>
      <Header />

      <FlashNewsBar
        articles={flashArticles}
      />

      <SocialSidebar />

      <main className="articleDetailsPage">
        <section className="articleDetailsHero">
          <div className="articleDetailsContainer">
            <Link
              href="/web-news"
              className="articleBackLink"
            >
              <FaArrowLeft />

              <span>
                Back to Web News
              </span>
            </Link>

            <div className="articleCategoryRow">
              <span className="articleCategory">
                Web News
              </span>

              {article.isFlash && (
                <span className="articleFlashLabel">
                  Flash News
                </span>
              )}
            </div>

            <h1>
              {article.title}
            </h1>

            <div className="articleInformation">
              {article.district && (
                <span>
                  <FaLocationDot />

                  {article.district}
                </span>
              )}

              {article.reporter && (
                <span>
                  <FaUserPen />

                  {article.reporter}
                </span>
              )}

              {articleDate && (
                <span>
                  <FaCalendarDays />

                  {articleDate}
                </span>
              )}

              <span>
                <FaEye />

                {article.views || 0}{" "}
                views
              </span>
            </div>
          </div>
        </section>

        <section className="articleDetailsContentSection">
          <article className="articleDetailsContainer articleDetailsCard">
            {mainImage ? (
              <figure className="articleMainFigure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainImage.url}
                  alt={
                    mainImage.caption ||
                    article.title
                  }
                  className="articleMainImage"
                />

                {mainImage.caption && (
                  <figcaption>
                    {
                      mainImage.caption
                    }
                  </figcaption>
                )}
              </figure>
            ) : (
              <div className="articleMainImageFallback">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/political-khati-logo.png"
                  alt="Political Khati"
                />
              </div>
            )}

            <div className="articleInnerContent">
              <ShareButtons
                title={article.title}
              />

              <div className="articleBodyContent">
                {contentParagraphs.length >
                0 ? (
                  contentParagraphs.map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    )
                  )
                ) : (
                  <div className="articleNoContent">
                    <FaRegNewspaper />

                    <p>
                      The complete article
                      content will be
                      updated shortly.
                    </p>
                  </div>
                )}
              </div>

              {additionalImages.length >
                0 && (
                <section className="articleGallery">
                  <h2>
                    More Images
                  </h2>

                  <div className="articleGalleryGrid">
                    {additionalImages.map(
                      (
                        image,
                        index
                      ) => (
                        <figure
                          key={
                            image.key ||
                            `${image.url}-${index}`
                          }
                          className="articleGalleryFigure"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              image.url
                            }
                            alt={
                              image.caption ||
                              `${article.title} image ${
                                index + 2
                              }`
                            }
                          />

                          {image.caption && (
                            <figcaption>
                              {
                                image.caption
                              }
                            </figcaption>
                          )}
                        </figure>
                      )
                    )}
                  </div>
                </section>
              )}

              {article.tags &&
                article.tags.length >
                  0 && (
                  <div className="articleDetailTags">
                    <span>
                      Tags:
                    </span>

                    <div>
                      {article.tags.map(
                        (tag) => (
                          <Link
                            href={`/web-news?search=${encodeURIComponent(
                              tag
                            )}`}
                            key={tag}
                          >
                            {tag}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="articleBottomActions">
                <Link
                  href="/web-news"
                  className="articleAllNewsButton"
                >
                  <FaArrowLeft />

                  View All Web News
                </Link>

                <ShareButtons
                  title={article.title}
                />
              </div>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </>
  );
}