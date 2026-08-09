import type { Metadata } from "next";
import Link from "next/link";

import { FaUserTie } from "react-icons/fa6";

import FlashNewsBar from "../../components/FlashNewsBar";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import SocialSidebar from "../../components/SocialSidebar";

import {
  getFlashArticles,
  getReporters,
  type Reporter,
} from "../../lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reporters",
  description:
    "Meet the reporters of Political Khati from across Odisha.",
};

function ReporterCard({
  reporter,
}: {
  reporter: Reporter;
}) {
  return (
    <Link
      href={`/reporters/${reporter._id}`}
      className="reporterHorizontalCard"
    >
      <div className="reporterHorizontalPhotoWrapper">
        {reporter.photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reporter.photo.url}
            alt={reporter.name}
            className="reporterHorizontalPhoto"
          />
        ) : (
          <div className="reporterHorizontalFallback">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/political-khati-logo.png"
              alt="Political Khati"
            />
          </div>
        )}
      </div>

      <div className="reporterHorizontalDivider" />

      <div className="reporterHorizontalContent">
        <h2>{reporter.name}</h2>

        <p className="reporterHorizontalDesignation">
          {reporter.designation}
        </p>

        <p className="reporterHorizontalDistrict">
          {reporter.district}
        </p>
      </div>
    </Link>
  );
}

export default async function ReportersPage() {
  const [flashArticles, reporters] =
    await Promise.all([
      getFlashArticles(),
      getReporters(),
    ]);

  const sortedReporters = [...reporters].sort(
    (a, b) =>
      Number(a.serialNumber || 999999) -
      Number(b.serialNumber || 999999),
  );

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

            <h1>Reporters</h1>

            <p>
              Meet the Political Khati
              reporters bringing news and
              updates from districts across
              Odisha.
            </p>
          </div>
        </section>

        <section className="listingContentSection">
          <div className="siteContainer">
            <div className="listingToolbar">
              <div>
                <h2>
                  Our Reporters
                </h2>

                <p>
                  {sortedReporters.length}{" "}
                  {sortedReporters.length === 1
                    ? "reporter"
                    : "reporters"}
                </p>
              </div>
            </div>

            {sortedReporters.length > 0 ? (
              <div className="reportersListingGrid">
                {sortedReporters.map(
                  (reporter) => (
                    <ReporterCard
                      reporter={reporter}
                      key={reporter._id}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="listingEmptyState">
                <FaUserTie />

                <h2>
                  No reporters found
                </h2>

                <p>
                  Reporter profiles will
                  appear here.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}