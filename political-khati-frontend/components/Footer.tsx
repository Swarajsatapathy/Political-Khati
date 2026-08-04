import Image from "next/image";
import Link from "next/link";

import {
  FaEnvelope,
  FaFacebookF,
  FaLocationDot,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";

import { FaXTwitter } from "react-icons/fa6";

const CONTACT_DETAILS = {
  email: "contact@politicalkhati.in",
  whatsappNumber: "919876543210",
  whatsappDisplay: "+91 98765 43210",
  location: "Odisha, India",
};

const whatsappMessage = encodeURIComponent(
  "Hello Political Khati, I want to contact the news desk.",
);

const SOCIAL_LINKS = {
  facebook: "#",
  x: "#",
  whatsapp: `https://wa.me/${CONTACT_DETAILS.whatsappNumber}?text=${whatsappMessage}`,
  youtube: "#",
};

export default function Footer() {
  return (
    <footer className="siteFooter">
      <div className="siteContainer footerGrid">
        <section className="footerBrand">
          <div className="footerBrandHeader">
            <Image
              src="/political-khati-logo.png"
              alt="Political Khati"
              width={72}
              height={72}
              className="footerLogo"
            />

            <div>
              <h2>Political Khati</h2>
              <p>Unfiltered Politics</p>
            </div>
          </div>

          <p className="footerDescription">
            Political Khati is a digital news platform presenting political
            developments, web news and video news with clarity and
            responsibility.
          </p>

          <span className="footerInitiative">A Srishti News Initiative</span>
        </section>

        <section className="footerColumn">
          <h3>Quick Links</h3>

          <nav className="footerLinks">
            <Link href="/">Home</Link>
            <Link href="/about-us">About Us</Link>
            <Link href="/web-news">Web News</Link>
            <Link href="/video-news">Video News</Link>
            <Link href="/contact-us">Contact Us</Link>
          </nav>
        </section>

        <section className="footerColumn">
          <h3>Contact Us</h3>

          <div className="footerContactList">
            <a
              href={`mailto:${CONTACT_DETAILS.email}`}
              className="footerContactItem footerContactLink"
              aria-label={`Email Political Khati at ${CONTACT_DETAILS.email}`}
            >
              <span className="footerContactIcon">
                <FaEnvelope />
              </span>

              <div>
                <small>Email</small>
                <p>{CONTACT_DETAILS.email}</p>
              </div>
            </a>

            <a
              href={`https://wa.me/${CONTACT_DETAILS.whatsappNumber}?text=${whatsappMessage}`}
              className="footerContactItem footerContactLink"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact Political Khati on WhatsApp"
            >
              <span className="footerContactIcon">
                <FaWhatsapp />
              </span>

              <div>
                <small>WhatsApp</small>
                <p>{CONTACT_DETAILS.whatsappDisplay}</p>
              </div>
            </a>

            <div className="footerContactItem">
              <span className="footerContactIcon">
                <FaLocationDot />
              </span>

              <div>
                <small>Location</small>
                <p>{CONTACT_DETAILS.location}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="footerColumn">
          <h3>Follow Political Khati</h3>

          <p className="footerFollowText">
            Follow our official social channels for the latest web news,
            political updates and video news.
          </p>

          <div className="footerSocialLinks">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href={SOCIAL_LINKS.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
            >
              <FaXTwitter />
            </a>

            <a
              href={SOCIAL_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <FaYoutube />
            </a>

            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
          </div>

          <Link href="/contact-us" className="footerContactButton">
            Contact News Desk
          </Link>
        </section>
      </div>

      <div className="footerBottom">
        <div className="siteContainer footerBottomInner">
          <p>
            © {new Date().getFullYear()} Political Khati. All rights reserved.
          </p>

          <p>A Srishti News Initiative</p>
        </div>
      </div>
    </footer>
  );
}
