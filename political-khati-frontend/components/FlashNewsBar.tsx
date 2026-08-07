import Link from "next/link";

import type {
  FlashArticle,
  Video,
} from "../lib/api";

type FlashNewsBarProps = {
  articles: FlashArticle[];
  videos?: Video[];
};

type FlashItem = {
  _id: string;
  title: string;
  slug: string;
  district?: string;
  type: "article" | "video";
};

export default function FlashNewsBar({
  articles,
  videos = [],
}: FlashNewsBarProps) {
  const flashItems: FlashItem[] = [
    ...articles.map((article) => ({
      _id: article._id,
      title: article.title,
      slug: article.slug,
      district: article.district,
      type: "article" as const,
    })),

    ...videos.map((video) => ({
      _id: video._id,
      title: video.title,
      slug: video.slug,
      district: video.district,
      type: "video" as const,
    })),
  ];

  function getFlashLink(item: FlashItem) {
    if (item.type === "video") {
      return `/video-news/${item.slug}`;
    }

    return `/web-news/${item.slug}`;
  }

  return (
    <section
      className="flashNewsBar"
      aria-label="Flash news"
    >
      <div className="siteContainer flashNewsInner">
        <div className="flashNewsHeading">
          <span className="flashNewsDot" />

          <span className="flashNewsLabel">
            FLASH!
          </span>
        </div>

        <div className="flashTickerViewport">
          {flashItems.length > 0 ? (
            <div className="flashTickerTrack">
              {/* First Set */}
              <div className="flashTickerGroup">
                {flashItems.map((item) => (
                  <Link
                    href={getFlashLink(item)}
                    className="flashTickerItem"
                    key={`${item.type}-${item._id}`}
                  >
                    <span>
                      {item.title}
                    </span>

                    {item.district && (
                      <small>
                        {item.district}
                      </small>
                    )}
                  </Link>
                ))}
              </div>

              {/* Duplicate Set */}
              <div
                className="flashTickerGroup"
                aria-hidden="true"
              >
                {flashItems.map((item) => (
                  <Link
                    href={getFlashLink(item)}
                    className="flashTickerItem"
                    key={`duplicate-${item.type}-${item._id}`}
                    tabIndex={-1}
                  >
                    <span>
                      {item.title}
                    </span>

                    {item.district && (
                      <small>
                        {item.district}
                      </small>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="flashNewsEmpty">
              No flash news available
            </p>
          )}
        </div>
      </div>
    </section>
  );
}