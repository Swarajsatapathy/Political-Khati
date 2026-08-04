"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaRegNewspaper,
  FaVideo,
} from "react-icons/fa6";

import type { Article, Video } from "../lib/api";

type HomeNewsShowcaseProps = {
  articles: Article[];
  videos: Video[];
};

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

function ArticleCard({
  article,
}: {
  article: Article;
}) {
  const articleImage = article.images?.[0]?.url;

  return (
    <article className="homeShowcaseCard">
      <Link
        href={`/web-news/${article.slug}`}
        className="homeShowcaseImageWrapper"
      >
        {articleImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={articleImage}
            alt={article.title}
            className="homeShowcaseImage"
          />
        ) : (
          <div className="homeShowcaseFallback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/political-khati-logo.png"
              alt="Political Khati"
            />
          </div>
        )}

        {article.isFlash && (
          <span className="homeFlashBadge">
            Flash
          </span>
        )}
      </Link>

      <div className="homeShowcaseBody">
        <div className="homeCardMeta">
          <span>{article.district}</span>

          {article.reporter && (
            <>
              <span className="metaSeparator">•</span>
              <span>{article.reporter}</span>
            </>
          )}

          {(article.publishedAt ||
            article.createdAt) && (
            <>
              <span className="metaSeparator">•</span>

              <span>
                {formatDate(
                  article.publishedAt ||
                    article.createdAt
                )}
              </span>
            </>
          )}
        </div>

        <h3 className="homeCardTitle">
          <Link href={`/web-news/${article.slug}`}>
            {article.title}
          </Link>
        </h3>

        {article.tags &&
          article.tags.length > 0 && (
            <div className="homeCardTags">
              {article.tags
                .slice(0, 3)
                .map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
            </div>
          )}

        <Link
          href={`/web-news/${article.slug}`}
          className="homeCardButton"
        >
          Read Full News
        </Link>
      </div>
    </article>
  );
}

function VideoCard({
  video,
}: {
  video: Video;
}) {
  return (
    <article className="homeShowcaseCard">
      <Link
        href={`/video-news/${video.slug}`}
        className="homeShowcaseImageWrapper"
      >
        {video.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail}
            alt={video.title}
            className="homeShowcaseImage"
          />
        ) : (
          <div className="homeShowcaseFallback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/political-khati-logo.png"
              alt="Political Khati"
            />
          </div>
        )}

        <span className="homeVideoPlayButton">
          <FaPlay />
        </span>

        {video.isFlash && (
          <span className="homeFlashBadge">
            Flash
          </span>
        )}
      </Link>

      <div className="homeShowcaseBody">
        <div className="homeCardMeta">
          <span>{video.district}</span>

          {video.reporter && (
            <>
              <span className="metaSeparator">•</span>
              <span>{video.reporter}</span>
            </>
          )}

          {(video.publishedAt ||
            video.createdAt) && (
            <>
              <span className="metaSeparator">•</span>

              <span>
                {formatDate(
                  video.publishedAt ||
                    video.createdAt
                )}
              </span>
            </>
          )}
        </div>

        <h3 className="homeCardTitle">
          <Link href={`/video-news/${video.slug}`}>
            {video.title}
          </Link>
        </h3>

        {video.description && (
          <p className="homeVideoDescription">
            {video.description}
          </p>
        )}

        <Link
          href={`/video-news/${video.slug}`}
          className="homeCardButton"
        >
          Watch Video
        </Link>
      </div>
    </article>
  );
}

export default function HomeNewsShowcase({
  articles,
  videos,
}: HomeNewsShowcaseProps) {
  const [articleIndex, setArticleIndex] =
    useState(0);

  const [videoIndex, setVideoIndex] =
    useState(0);

  const [pauseArticles, setPauseArticles] =
    useState(false);

  const [pauseVideos, setPauseVideos] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Safe derived slider values
  |--------------------------------------------------------------------------
  */

  const safeArticleIndex =
    articles.length > 0
      ? articleIndex % articles.length
      : 0;

  const safeVideoIndex =
    videos.length > 0
      ? videoIndex % videos.length
      : 0;

  const currentArticle =
    articles[safeArticleIndex];

  const currentVideo =
    videos[safeVideoIndex];

  /*
  |--------------------------------------------------------------------------
  | Automatic article slider
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      articles.length <= 1 ||
      pauseArticles
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setArticleIndex(
        (currentIndex) =>
          (currentIndex + 1) %
          articles.length
      );
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [articles.length, pauseArticles]);

  /*
  |--------------------------------------------------------------------------
  | Automatic video slider
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      videos.length <= 1 ||
      pauseVideos
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setVideoIndex(
        (currentIndex) =>
          (currentIndex + 1) %
          videos.length
      );
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [videos.length, pauseVideos]);

  const previousArticle = () => {
    if (articles.length <= 1) {
      return;
    }

    setArticleIndex(
      (currentIndex) =>
        (currentIndex -
          1 +
          articles.length) %
        articles.length
    );
  };

  const nextArticle = () => {
    if (articles.length <= 1) {
      return;
    }

    setArticleIndex(
      (currentIndex) =>
        (currentIndex + 1) %
        articles.length
    );
  };

  const previousVideo = () => {
    if (videos.length <= 1) {
      return;
    }

    setVideoIndex(
      (currentIndex) =>
        (currentIndex -
          1 +
          videos.length) %
        videos.length
    );
  };

  const nextVideo = () => {
    if (videos.length <= 1) {
      return;
    }

    setVideoIndex(
      (currentIndex) =>
        (currentIndex + 1) %
        videos.length
    );
  };

  return (
    <section className="homeShowcaseSection">
      <div className="siteContainer homeShowcaseGrid">
        {/* Web News */}
        <div
          className="homeShowcaseColumn"
          onMouseEnter={() =>
            setPauseArticles(true)
          }
          onMouseLeave={() =>
            setPauseArticles(false)
          }
        >
          <div className="homeSectionHeading">
            <h2>Web News</h2>

            <div className="homeSliderControls">
              <button
                type="button"
                aria-label="Previous web news"
                onClick={previousArticle}
                disabled={articles.length <= 1}
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                aria-label="Next web news"
                onClick={nextArticle}
                disabled={articles.length <= 1}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div
            className="homeCardAnimation"
            key={
              currentArticle?._id ||
              "empty-article"
            }
          >
            {currentArticle ? (
              <ArticleCard
                article={currentArticle}
              />
            ) : (
              <div className="homeShowcaseEmpty">
                <FaRegNewspaper />

                <h3>No web news available</h3>

                <p>
                  Published articles will
                  appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Video News */}
        <div
          className="homeShowcaseColumn"
          onMouseEnter={() =>
            setPauseVideos(true)
          }
          onMouseLeave={() =>
            setPauseVideos(false)
          }
        >
          <div className="homeSectionHeading">
            <h2>Video News</h2>

            <div className="homeSliderControls">
              <button
                type="button"
                aria-label="Previous video news"
                onClick={previousVideo}
                disabled={videos.length <= 1}
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                aria-label="Next video news"
                onClick={nextVideo}
                disabled={videos.length <= 1}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div
            className="homeCardAnimation"
            key={
              currentVideo?._id ||
              "empty-video"
            }
          >
            {currentVideo ? (
              <VideoCard video={currentVideo} />
            ) : (
              <div className="homeShowcaseEmpty">
                <FaVideo />

                <h3>No video news available</h3>

                <p>
                  Published video news will
                  appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}