import Link from "next/link";

import type { FlashArticle } from "../lib/api";

type FlashNewsBarProps = {
  articles: FlashArticle[];
};

export default function FlashNewsBar({
  articles,
}: FlashNewsBarProps) {
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
          {articles.length > 0 ? (
            <div className="flashTickerTrack">
              {/* First set */}
              <div className="flashTickerGroup">
                {articles.map((article) => (
                  <Link
                    href={`/web-news/${article.slug}`}
                    className="flashTickerItem"
                    key={article._id}
                  >
                    <span>{article.title}</span>

                    {article.district && (
                      <small>
                        {article.district}
                      </small>
                    )}
                  </Link>
                ))}
              </div>

              {/* Duplicate set for continuous scrolling */}
              <div
                className="flashTickerGroup"
                aria-hidden="true"
              >
                {articles.map((article) => (
                  <Link
                    href={`/web-news/${article.slug}`}
                    className="flashTickerItem"
                    key={`duplicate-${article._id}`}
                    tabIndex={-1}
                  >
                    <span>{article.title}</span>

                    {article.district && (
                      <small>
                        {article.district}
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