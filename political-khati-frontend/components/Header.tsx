import Image from "next/image";
import Link from "next/link";

import MobileNavigation from "./MobileNavigation";

export default function Header() {
  return (
    <header className="siteHeader">
      {/* Top information strip */}
      <div className="headerTopStrip">
        <div className="siteContainer headerTopStripInner">
          <p>POLITICAL KHATI NEWS PLATFORM</p>

          <p>UNFILTERED POLITICS</p>
        </div>
      </div>

      {/* Logo section */}
      <div className="headerLogoSection">
        <Link
          href="/"
          className="headerLogoLink"
          aria-label="Political Khati homepage"
        >
          <Image
            src="/political-khati-logo.png"
            alt="Political Khati"
            width={170}
            height={170}
            className="headerLogo"
            priority
          />
        </Link>
      </div>

      {/* Desktop and mobile navigation */}
      <MobileNavigation />
    </header>
  );
}