import Link from "next/link";

import {
  FaArrowRight,
  FaHouse,
  FaMagnifyingGlass,
} from "react-icons/fa6";

import Footer from "../components/Footer";
import Header from "../components/Header";
import SocialSidebar from "../components/SocialSidebar";

export default function NotFound() {
  return (
    <>
      <Header />

      <SocialSidebar />

      <main className="notFoundPage">
        <section className="notFoundSection">
          <div className="siteContainer notFoundContainer">
            <div className="notFoundVisual">
              <span className="notFoundNumber">
                404
              </span>

              <div className="notFoundSearchIcon">
                <FaMagnifyingGlass />
              </div>
            </div>

            <div className="notFoundContent">
              <p className="notFoundEyebrow">
                PAGE NOT FOUND
              </p>

              <h1>
                The page you are looking for does not exist
              </h1>

              <p className="notFoundDescription">
                The news article, video or page may have
                been removed, renamed or the address may
                have been entered incorrectly.
              </p>

              <div className="notFoundActions">
                <Link
                  href="/"
                  className="notFoundPrimaryButton"
                >
                  <FaHouse />
                  Go to Homepage
                </Link>

                <Link
                  href="/web-news"
                  className="notFoundSecondaryButton"
                >
                  Browse Web News
                  <FaArrowRight />
                </Link>
              </div>

              <div className="notFoundQuickLinks">
                <span>Explore:</span>

                <Link href="/web-news">
                  Web News
                </Link>

                <Link href="/video-news">
                  Video News
                </Link>

                <Link href="/about-us">
                  About Us
                </Link>

                <Link href="/contact-us">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}