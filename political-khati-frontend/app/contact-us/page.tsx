import type { Metadata } from "next";

import {
  FaEnvelope,
  FaFacebookF,
  FaPhoneAlt,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

import FlashNewsBar from "../../components/FlashNewsBar";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import SocialSidebar from "../../components/SocialSidebar";

import { getFlashArticles } from "../../lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the Political Khati news desk for official communication, news updates, feedback and information.",
  alternates: {
    canonical: "/contact-us",
  },
};

/*
|--------------------------------------------------------------------------
| Update Official Contact Details Here
|--------------------------------------------------------------------------
*/

const CONTACT_DETAILS = {
  mobileNumber: "+91 96684 21545",
  mobileLink: "919668421545",

  emailAddress: "srishtinews@gmail.com",
  emailLink: "srishtinews@gmail.com",
};

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/share/1DHgzfWWFg/",
  youtube: "https://www.youtube.com/@politicalkhati",
  whatsapp: "https://wa.me/919668421545?text=Hello%20Political%20Khati,%20I%20want%20to%20contact%20the%20news%20desk.",
  x: "#",
};

export default async function ContactUsPage() {
  const flashArticles = await getFlashArticles();

  return (
    <>
      <Header />

      <FlashNewsBar articles={flashArticles} />

      <SocialSidebar />

      <main className="contactPage">
        <section className="contactSection">
          <div className="siteContainer contactPageCard">
            <header className="contactPageHeader">
              <p>CONTACT DESK</p>

              <h1>Contact Us</h1>

              <span>
                For news updates, feedback and official
                communication
              </span>
            </header>

            <div className="contactPageBody">
              <h2>Political Khati</h2>

              <div className="contactDetailsGrid">
                <article className="contactDetailCard">
                  <div className="contactDetailIcon">
                    <FaPhoneAlt />
                  </div>

                  <div>
                    <p>Mobile</p>

                    {CONTACT_DETAILS.mobileLink ? (
                      <a
                        href={`tel:${CONTACT_DETAILS.mobileLink}`}
                      >
                        {CONTACT_DETAILS.mobileNumber}
                      </a>
                    ) : (
                      <strong>
                        {CONTACT_DETAILS.mobileNumber}
                      </strong>
                    )}
                  </div>
                </article>

                <article className="contactDetailCard">
                  <div className="contactDetailIcon">
                    <FaEnvelope />
                  </div>

                  <div>
                    <p>E-Mail</p>

                    {CONTACT_DETAILS.emailLink ? (
                      <a
                        href={`mailto:${CONTACT_DETAILS.emailLink}`}
                      >
                        {CONTACT_DETAILS.emailAddress}
                      </a>
                    ) : (
                      <strong>
                        {CONTACT_DETAILS.emailAddress}
                      </strong>
                    )}
                  </div>
                </article>
              </div>

              <section className="contactSocialSection">
                <div className="contactSocialHeading">
                  <div>
                    <p>SOCIAL PRESENCE</p>

                    <h2>
                      Follow Political Khati
                    </h2>
                  </div>

                  <span>
                    Stay connected for the latest political
                    and public-interest updates.
                  </span>
                </div>

                <div className="contactSocialLinks">
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Political Khati on Facebook"
                    className="contactFacebook"
                  >
                    <FaFacebookF />
                  </a>

                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Political Khati on YouTube"
                    className="contactYoutube"
                  >
                    <FaYoutube />
                  </a>

                  <a
                    href={SOCIAL_LINKS.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Political Khati on WhatsApp"
                    className="contactWhatsapp"
                  >
                    <FaWhatsapp />
                  </a>

                  <a
                    href={SOCIAL_LINKS.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Political Khati on X"
                    className="contactX"
                  >
                    <FaXTwitter />
                  </a>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}