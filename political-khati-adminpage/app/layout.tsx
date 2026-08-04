import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Political Khati Admin",
  description: "Political Khati administration dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}