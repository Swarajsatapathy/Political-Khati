"use client";

import { useState } from "react";

import {
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa";

import {
  FaCheck,
  FaLink,
  FaXTwitter,
} from "react-icons/fa6";

type ShareButtonsProps = {
  title: string;
};

export default function ShareButtons({
  title,
}: ShareButtonsProps) {
  const [copied, setCopied] =
    useState(false);

  const getCurrentUrl = () => {
    if (
      typeof window === "undefined"
    ) {
      return "";
    }

    return window.location.href;
  };

  const openShareWindow = (
    url: string
  ) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=650,height=560"
    );
  };

  const shareOnFacebook = () => {
    const currentUrl =
      getCurrentUrl();

    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        currentUrl
      )}`
    );
  };

  const shareOnX = () => {
    const currentUrl =
      getCurrentUrl();

    openShareWindow(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title
      )}&url=${encodeURIComponent(
        currentUrl
      )}`
    );
  };

  const shareOnWhatsApp = () => {
    const currentUrl =
      getCurrentUrl();

    openShareWindow(
      `https://wa.me/?text=${encodeURIComponent(
        `${title}\n${currentUrl}`
      )}`
    );
  };

  const copyLink = async () => {
    const currentUrl =
      getCurrentUrl();

    try {
      await navigator.clipboard.writeText(
        currentUrl
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      const temporaryInput =
        document.createElement(
          "textarea"
        );

      temporaryInput.value =
        currentUrl;

      temporaryInput.style.position =
        "fixed";

      temporaryInput.style.opacity =
        "0";

      document.body.appendChild(
        temporaryInput
      );

      temporaryInput.select();

      document.execCommand("copy");

      document.body.removeChild(
        temporaryInput
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <div
      className="shareButtons"
      aria-label="Share this article"
    >
      <span className="shareButtonsLabel">
        Share:
      </span>

      <button
        type="button"
        className="shareFacebook"
        onClick={shareOnFacebook}
        aria-label="Share on Facebook"
      >
        <FaFacebookF />
      </button>

      <button
        type="button"
        className="shareX"
        onClick={shareOnX}
        aria-label="Share on X"
      >
        <FaXTwitter />
      </button>

      <button
        type="button"
        className="shareWhatsapp"
        onClick={shareOnWhatsApp}
        aria-label="Share on WhatsApp"
      >
        <FaWhatsapp />
      </button>

      <button
        type="button"
        className={
          copied
            ? "shareCopy shareCopySuccess"
            : "shareCopy"
        }
        onClick={copyLink}
        aria-label="Copy article link"
      >
        {copied ? (
          <FaCheck />
        ) : (
          <FaLink />
        )}

        <span>
          {copied
            ? "Copied"
            : "Copy Link"}
        </span>
      </button>
    </div>
  );
}