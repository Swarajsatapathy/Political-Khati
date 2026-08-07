import {
  FaFacebookF,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/share/1DHgzfWWFg/",
  x: "#",
  whatsapp: "https://wa.me/919668421545?text=Hello%20Political%20Khati,%20I%20want%20to%20contact%20the%20news%20desk.",
  youtube: "https://www.youtube.com/@politicalkhati",
};

export default function SocialSidebar() {
  return (
    <aside
      className="socialSidebar"
      aria-label="Political Khati social media"
    >
      <a
        href={SOCIAL_LINKS.facebook}
        className="socialFacebook"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Political Khati on Facebook"
      >
        <FaFacebookF />
      </a>

      <a
        href={SOCIAL_LINKS.x}
        className="socialX"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Political Khati on X"
      >
        <FaXTwitter />
      </a>

      <a
        href={SOCIAL_LINKS.whatsapp}
        className="socialWhatsapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Political Khati on WhatsApp"
      >
        <FaWhatsapp />
      </a>

      <a
        href={SOCIAL_LINKS.youtube}
        className="socialYoutube"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Political Khati on YouTube"
      >
        <FaYoutube />
      </a>
    </aside>
  );
}