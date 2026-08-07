import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { FaYoutube } from "react-icons/fa";

import {
  FaArrowLeft,
  FaCalendarDays,
  FaEye,
  FaLocationDot,
  FaPlay,
  FaUserPen,
} from "react-icons/fa6";

import FlashNewsBar from "../../../components/FlashNewsBar";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import ShareButtons from "../../../components/ShareButtons";
import SocialSidebar from "../../../components/SocialSidebar";

import {
  getFlashArticles,
  getVideoBySlug,
  type Video,
} from "../../../lib/api";

export const dynamic = "force-dynamic";

type VideoDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function createVideoDescription(description?: string) {
  if (!description) {
    return "Watch the latest political video news and updates from Political Khati.";
  }

  const cleanDescription = description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanDescription.length <= 160) {
    return cleanDescription;
  }

  return `${cleanDescription.slice(0, 157)}...`;
}

/* =========================================================
   DATE & TIME - INDIA (IST)
   ========================================================= */

function formatVideoDate(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/* =========================================================
   YOUTUBE VIDEO ID
   ========================================================= */

function extractYouTubeVideoId(video: Video) {
  if (video.youtubeVideoId) {
    return video.youtubeVideoId;
  }

  if (!video.youtubeUrl) {
    return "";
  }

  const patterns = [
    /youtube.com\/watch\?v=([^&]+)/,
    /youtu.be\/([^?&/]+)/,
    /youtube.com\/embed\/([^?&/]+)/,
    /youtube.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = video.youtubeUrl.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function createDescriptionParagraphs(description?: string) {
  if (!description) {
    return [];
  }

  return description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/* =========================================================
   METADATA
   ========================================================= */

export async function generateMetadata({
  params,
}: VideoDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;

  const video = await getVideoBySlug(slug);

  if (!video) {
    return {
      title: "Video Not Found",
      description:
        "The requested Political Khati video could not be found.",
    };
  }

  const description = createVideoDescription(video.description);

  const previewImage =
    video.thumbnail || "/political-khati-logo.png";

  return {
    title: video.title,
    description,

    alternates: {
      canonical: `/video-news/${video.slug}`,
    },

    openGraph: {
      title: video.title,
      description,
      url: `/video-news/${video.slug}`,
      siteName: "Political Khati",
      type: "video.other",

      images: [
        {
          url: previewImage,
          width: 1920,
          height: 1080,
          alt: video.title,
        },
      ],

      videos: video.youtubeUrl
        ? [
            {
              url: video.youtubeUrl,
            },
          ]
        : undefined,
    },

    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [previewImage],
    },
  };
}

/* =========================================================
   VIDEO DETAILS PAGE
   ========================================================= */

export default async function VideoDetailsPage({
  params,
}: VideoDetailsPageProps) {
  const { slug } = await params;

  const [video, flashArticles] = await Promise.all([
    getVideoBySlug(slug),
    getFlashArticles(),
  ]);

  if (!video || video.isPublished === false) {
    notFound();
  }

  const youtubeVideoId =
    extractYouTubeVideoId(video);

  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?rel=0`
    : "";

  const videoDate = formatVideoDate(
    video.publishedAt || video.createdAt
  );

  const descriptionParagraphs =
    createDescriptionParagraphs(video.description);

  return (
    <>
      <Header />

      <FlashNewsBar articles={flashArticles} />

      <SocialSidebar />

      <main className="videoDetailsPage">
        {/* =====================================================
            VIDEO HERO
            ===================================================== */}

        <section className="videoDetailsHero">
          <div className="videoDetailsContainer">
            <Link
              href="/video-news"
              className="videoBackLink"
            >
              <FaArrowLeft />

              <span>Back to Video News</span>
            </Link>

            <div className="videoCategoryRow">
              <span className="videoCategoryLabel">
                <FaPlay />
                Video News
              </span>

              {video.isFlash && (
                <span className="videoFlashLabel">
                  Flash News
                </span>
              )}
            </div>

            <h1>{video.title}</h1>

            <div className="videoInformation">
              {video.district && (
                <span>
                  <FaLocationDot />
                  {video.district}
                </span>
              )}

              {video.reporter && (
                <span>
                  <FaUserPen />
                  {video.reporter}
                </span>
              )}

              {videoDate && (
                <span>
                  <FaCalendarDays />
                  {videoDate}
                </span>
              )}

              <span>
                <FaEye />
                {video.views || 0} views
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            VIDEO CONTENT
            ===================================================== */}

        <section className="videoDetailsContentSection">
          <article className="videoDetailsContainer videoDetailsCard">
            {/* Video Player */}

            <div className="videoPlayerWrapper">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={video.title}
                  className="videoPlayer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="videoPlayerFallback">
                  <FaYoutube />

                  <h2>Video unavailable</h2>

                  <p>
                    The YouTube video link is
                    missing or invalid.
                  </p>
                </div>
              )}
            </div>

            {/* Video Body */}

            <div className="videoDetailsBody">
              <div className="videoTopActions">
                <ShareButtons
                  title={video.title}
                />

                {video.youtubeUrl && (
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="watchOnYoutubeButton"
                  >
                    <FaYoutube />
                    Watch on YouTube
                  </a>
                )}
              </div>

              {/* Description */}

              <section className="videoDescriptionSection">
                <h2>Video Description</h2>

                {descriptionParagraphs.length >
                0 ? (
                  <div className="videoDescriptionContent">
                    {descriptionParagraphs.map(
                      (paragraph, index) => (
                        <p key={index}>
                          {paragraph}
                        </p>
                      )
                    )}
                  </div>
                ) : (
                  <div className="videoNoDescription">
                    <FaPlay />

                    <p>
                      The video description will
                      be updated shortly.
                    </p>
                  </div>
                )}
              </section>

              {/* Tags */}

              {video.tags &&
                video.tags.length > 0 && (
                  <div className="videoDetailTags">
                    <span>Tags:</span>

                    <div>
                      {video.tags.map((tag) => (
                        <Link
                          href={`/video-news?search=${encodeURIComponent(
                            tag
                          )}`}
                          key={tag}
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {/* Bottom Actions */}

              <div className="videoBottomActions">
                <Link
                  href="/video-news"
                  className="videoAllNewsButton"
                >
                  <FaArrowLeft />
                  View All Video News
                </Link>

                <ShareButtons
                  title={video.title}
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