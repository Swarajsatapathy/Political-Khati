import type { Metadata } from "next";

import {
  Merriweather,
  Noto_Sans_Oriya,
  Source_Sans_3,
} from "next/font/google";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-interface",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-heading",
});

const notoSansOriya = Noto_Sans_Oriya({
  subsets: ["oriya"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-odia",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Political Khati | Unfiltered Politics",
    template: "%s | Political Khati",
  },

  description:
    "Political Khati brings web news, video news and political developments from Odisha and beyond.",

  icons: {
    icon: "/political-khati-logo.png",
  },

  openGraph: {
    title: "Political Khati | Unfiltered Politics",
    description:
      "Web news, video news and political developments from Political Khati.",
    url: siteUrl,
    siteName: "Political Khati",
    type: "website",
    images: [
      {
        url: "/political-khati-logo.png",
        width: 1200,
        height: 1200,
        alt: "Political Khati",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Political Khati | Unfiltered Politics",
    description:
      "Web news, video news and political developments.",
    images: ["/political-khati-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        ${sourceSans.variable}
        ${merriweather.variable}
        ${notoSansOriya.variable}
      `}
    >
      <body>{children}</body>
    </html>
  );
}