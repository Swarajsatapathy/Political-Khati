import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  FaArrowRight,
  FaBullseye,
  FaCheck,
  FaEye,
  FaRegNewspaper,
  FaShieldHalved,
  FaVideo,
} from "react-icons/fa6";

import FlashNewsBar from "../../components/FlashNewsBar";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import SocialSidebar from "../../components/SocialSidebar";

import { getFlashArticles } from "../../lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Political Khati, our editorial purpose, vision and commitment to responsible political journalism.",
  alternates: {
    canonical: "/about-us",
  },
};

const EDITORIAL_VALUES = [
  "Clear and understandable political reporting",
  "Responsible presentation of public issues",
  "Focus on Odisha and important national developments",
  "Accessible web news and video news",
  "Respect for facts and public interest",
];

export default async function AboutUsPage() {
  const flashArticles = await getFlashArticles();

  return (
    <>
      <Header />

      <FlashNewsBar articles={flashArticles} />

      <SocialSidebar />

      <main className="aboutPage">
        <section className="aboutHero">
          <div className="siteContainer aboutHeroInner">
            <div className="aboutHeroContent">
              <p className="aboutEyebrow">
                ABOUT POLITICAL KHATI
              </p>

              <h1>
                Politics explained with clarity,
                context and responsibility
              </h1>

              <p className="aboutHeroDescription">
                Political Khati is a digital news platform
                presenting political developments, public
                issues, web news and video news from Odisha
                and beyond.
              </p>

              <div className="aboutHeroActions">
                <Link
                  href="/web-news"
                  className="aboutPrimaryButton"
                >
                  Explore Web News
                  <FaArrowRight />
                </Link>

                <Link
                  href="/video-news"
                  className="aboutSecondaryButton"
                >
                  Watch Video News
                </Link>
              </div>
            </div>

            <div className="aboutHeroLogoWrapper">
              <div className="aboutHeroLogoGlow" />

              <Image
                src="/political-khati-logo.png"
                alt="Political Khati"
                width={300}
                height={300}
                className="aboutHeroLogo"
                priority
              />

              <span className="aboutHeroInitiative">
                A Srishti News Initiative
              </span>
            </div>
          </div>
        </section>

        <section className="aboutIntroductionSection">
          <div className="siteContainer aboutIntroductionGrid">
            <article className="aboutIntroductionContent">
              <p className="aboutSectionLabel">
                WHO WE ARE
              </p>

              <h2>
                A modern political news platform for
                informed readers
              </h2>

              <p>
                Political Khati provides political news and
                public-interest information through
                carefully presented web articles and video
                reports.
              </p>

              <p>
                Our goal is to make important developments
                easier to understand while maintaining a
                clean, accessible and reader-friendly news
                experience.
              </p>

              <p>
                The platform covers updates from districts
                across Odisha together with significant
                political and public developments from
                other regions.
              </p>
            </article>

            <aside className="aboutValuesCard">
              <div className="aboutValuesHeading">
                <FaShieldHalved />

                <div>
                  <p>OUR COMMITMENT</p>
                  <h3>Responsible journalism</h3>
                </div>
              </div>

              <div className="aboutValuesList">
                {EDITORIAL_VALUES.map((value) => (
                  <div
                    className="aboutValueItem"
                    key={value}
                  >
                    <span>
                      <FaCheck />
                    </span>

                    <p>{value}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="aboutPurposeSection">
          <div className="siteContainer">
            <div className="aboutSectionHeading">
              <p>OUR PURPOSE</p>

              <h2>
                What Political Khati aims to deliver
              </h2>
            </div>

            <div className="aboutPurposeGrid">
              <article className="aboutPurposeCard">
                <span className="aboutPurposeIcon">
                  <FaBullseye />
                </span>

                <h3>Our Mission</h3>

                <p>
                  To present political developments and
                  public issues in a clear, timely and
                  accessible format for readers across
                  Odisha and beyond.
                </p>
              </article>

              <article className="aboutPurposeCard">
                <span className="aboutPurposeIcon">
                  <FaEye />
                </span>

                <h3>Our Vision</h3>

                <p>
                  To build a dependable digital platform
                  where people can follow political news,
                  understand public issues and stay
                  informed.
                </p>
              </article>

              <article className="aboutPurposeCard">
                <span className="aboutPurposeIcon">
                  <FaShieldHalved />
                </span>

                <h3>Our Responsibility</h3>

                <p>
                  To maintain clarity, fairness and public
                  interest while presenting articles,
                  reports, interviews and political
                  updates.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="aboutContentTypesSection">
          <div className="siteContainer">
            <div className="aboutSectionHeading">
              <p>OUR CONTENT</p>

              <h2>
                News presented in two accessible formats
              </h2>
            </div>

            <div className="aboutContentTypesGrid">
              <article className="aboutContentTypeCard">
                <div className="aboutContentTypeIcon">
                  <FaRegNewspaper />
                </div>

                <div className="aboutContentTypeText">
                  <h3>Web News</h3>

                  <p>
                    Read political reports, district
                    updates, public issues and other
                    important developments through
                    structured news articles.
                  </p>

                  <Link href="/web-news">
                    View Web News
                    <FaArrowRight />
                  </Link>
                </div>
              </article>

              <article className="aboutContentTypeCard">
                <div className="aboutContentTypeIcon">
                  <FaVideo />
                </div>

                <div className="aboutContentTypeText">
                  <h3>Video News</h3>

                  <p>
                    Watch political updates, reports,
                    interviews and public-interest videos
                    through our dedicated video-news
                    section.
                  </p>

                  <Link href="/video-news">
                    View Video News
                    <FaArrowRight />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="aboutContactSection">
          <div className="siteContainer aboutContactCard">
            <div>
              <p className="aboutContactLabel">
                CONNECT WITH US
              </p>

              <h2>
                Have information, feedback or a news tip?
              </h2>

              <p>
                Reach the Political Khati news desk through
                our contact page.
              </p>
            </div>

            <Link
              href="/contact-us"
              className="aboutContactButton"
            >
              Contact News Desk
              <FaArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}