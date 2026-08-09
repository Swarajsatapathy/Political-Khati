"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  FaBars,
  FaXmark,
} from "react-icons/fa6";

const NAVIGATION_LINKS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About Us",
    href: "/about-us",
  },
  {
    label: "Web News",
    href: "/web-news",
  },
  {
    label: "Reporters",
    href: "/reporters",
  },
  {
    label: "Video News",
    href: "/video-news",
  },
  {
    label: "Contact Us",
    href: "/contact-us",
  },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const isActiveLink = (
    href: string
  ) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href
    );
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav
      className="mainNavigation"
      aria-label="Main navigation"
    >
      <div className="siteContainer navigationContainer">
        <button
          type="button"
          className="mobileMenuButton"
          aria-label={
            isMenuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={
            isMenuOpen
          }
          aria-controls="political-khati-navigation"
          onClick={() => {
            setIsMenuOpen(
              (currentValue) =>
                !currentValue
            );
          }}
        >
          {isMenuOpen ? (
            <FaXmark />
          ) : (
            <FaBars />
          )}
        </button>

        <div
          id="political-khati-navigation"
          className={
            isMenuOpen
              ? "navigationLinks navigationLinksOpen"
              : "navigationLinks"
          }
        >
          {NAVIGATION_LINKS.map(
            (navigationLink) => {
              const active =
                isActiveLink(
                  navigationLink.href
                );

              return (
                <Link
                  href={
                    navigationLink.href
                  }
                  key={
                    navigationLink.href
                  }
                  className={
                    active
                      ? "navigationLink navigationLinkActive"
                      : "navigationLink"
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  onClick={closeMenu}
                >
                  {
                    navigationLink.label
                  }
                </Link>
              );
            }
          )}
        </div>
      </div>
    </nav>
  );
}