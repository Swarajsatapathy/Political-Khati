import Image from "next/image";

import MobileNavigation from "./MobileNavigation";

export default function Header() {
  return (
    <header className="siteHeader">
      {/* Scrolling Top Bar */}
      <div className="headerTopBar">
        <div className="headerTicker">
          <div className="headerTickerTrack">
            <div className="headerTickerGroup">
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
            </div>

            <div className="headerTickerGroup" aria-hidden="true">
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
              <span>POLITICAL KHATI - UNFILTERED POLITICS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="headerMainSection">
        <div className="siteContainer headerBannerContainer">
          <div className="headerBanner">
            <Image
              src="/political-khati-banner.jpg"
              alt="Political Khati"
              fill
              sizes="(max-width: 700px) 100vw, 970px"
              className="headerBannerImage"
              priority
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <MobileNavigation />
    </header>
  );
}
