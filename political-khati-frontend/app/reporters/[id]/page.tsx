import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  FaArrowLeft,
  FaLocationDot,
  FaUserTie,
} from "react-icons/fa6";

import FlashNewsBar from "../../../components/FlashNewsBar";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";
import ShareButtons from "../../../components/ShareButtons";
import SocialSidebar from "../../../components/SocialSidebar";

import {
  getFlashArticles,
  getReporterById,
} from "../../../lib/api";

export const dynamic = "force-dynamic";

type ReporterDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: ReporterDetailsPageProps): Promise<Metadata> {
  const { id } = await params;

  const reporter =
    await getReporterById(id);

  if (!reporter) {
    return {
      title: "Reporter Not Found",
      description:
        "The requested Political Khati reporter could not be found.",
    };
  }

  const description =
    `${reporter.name} - ${reporter.designation}, ${reporter.district}. Political Khati Reporter.`;

  const reporterImage =
    reporter.photo?.url ||
    "/political-khati-logo.png";

  return {
    title: `${reporter.name} | Political Khati`,
    description,

    alternates: {
      canonical: `/reporters/${reporter._id}`,
    },

    openGraph: {
      title: reporter.name,
      description,
      url: `/reporters/${reporter._id}`,
      siteName: "Political Khati",
      type: "profile",

      images: [
        {
          url: reporterImage,
          alt: reporter.name,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: reporter.name,
      description,
      images: [reporterImage],
    },
  };
}

/* =========================================================
   REPORTER DETAILS PAGE
========================================================= */

export default async function ReporterDetailsPage({
  params,
}: ReporterDetailsPageProps) {
  const { id } = await params;

  const [reporter, flashArticles] =
    await Promise.all([
      getReporterById(id),
      getFlashArticles(),
    ]);

  if (!reporter) {
    notFound();
  }

  return (
    <>
      <Header />

      <FlashNewsBar
        articles={flashArticles}
      />

      <SocialSidebar />

      <main className="reporterDetailsPage">
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="reporterDetailsHero">
          <div className="siteContainer">
            <Link
              href="/reporters"
              className="reporterBackLink"
            >
              <FaArrowLeft />

              <span>
                Back to Reporters
              </span>
            </Link>

            <p className="listingPageEyebrow">
              POLITICAL KHATI
            </p>

            <h1>
              Reporter Profile
            </h1>
          </div>
        </section>

        {/* =====================================================
            PROFILE
        ====================================================== */}

        <section className="reporterDetailsContent">
          <div className="siteContainer">
            <article className="reporterProfileCard">
              {/* =================================================
                  PHOTO
              ================================================== */}

              <div className="reporterProfilePhotoColumn">
                <div className="reporterProfilePhotoWrapper">
                  {reporter.photo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reporter.photo.url}
                      alt={reporter.name}
                      className="reporterProfilePhoto"
                    />
                  ) : (
                    <div className="reporterProfilePhotoFallback">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/political-khati-logo.png"
                        alt="Political Khati"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* =================================================
                  INFORMATION
              ================================================== */}

              <div className="reporterProfileMain">
                <span className="reporterProfileBadge">
                  Political Khati Reporter
                </span>

                <h2>
                  {reporter.name}
                </h2>

                {/* ===============================================
                    EXISTING SHARE BUTTONS COMPONENT
                ================================================ */}

                <div className="reporterProfileShare">
                  <ShareButtons
                    title={reporter.name}
                  />
                </div>

                <div className="reporterProfileLine" />

                {/* ===============================================
                    DETAILS
                ================================================ */}

                <div className="reporterProfileDetailsList">
                  <div className="reporterProfileInfoRow">
                    <strong>
                      Name:
                    </strong>

                    <span>
                      {reporter.name}
                    </span>
                  </div>

                  <div className="reporterProfileInfoRow">
                    <strong>
                      Designation:
                    </strong>

                    <span>
                      {reporter.designation}
                    </span>
                  </div>

                  <div className="reporterProfileInfoRow">
                    <strong>
                      District:
                    </strong>

                    <span className="reporterProfileDistrictValue">
                      <FaLocationDot />

                      {reporter.district}
                    </span>
                  </div>

                  <div className="reporterProfileInfoRow">
                    <strong>
                      Profile:
                    </strong>

                    <span className="reporterProfileStatus">
                      <FaUserTie />

                      Political Khati Reporter
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}