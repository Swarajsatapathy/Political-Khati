import {
  FaFacebookF,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";

const SOCIAL_LINKS = {
  facebook: "#",
  x: "#",
  whatsapp: "#",
  youtube: "#",
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