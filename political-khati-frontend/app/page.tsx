export const dynamic = "force-dynamic";

import FlashNewsBar from "../components/FlashNewsBar";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HomeNewsShowcase from "../components/HomeNewsShowcase";
import SocialSidebar from "../components/SocialSidebar";

import {
  getFlashArticles,
  getFlashVideos,
  getPublishedArticles,
  getPublishedVideos,
  getReporters,
} from "../lib/api";

export default async function HomePage() {
  const [
    flashArticles,
    flashVideos,
    articles,
    videos,
    reporters,
  ] = await Promise.all([
    getFlashArticles(),
    getFlashVideos(),
    getPublishedArticles(10),
    getPublishedVideos(10),
    getReporters(),
  ]);

  return (
    <>
      <Header />

      <FlashNewsBar
        articles={flashArticles}
        videos={flashVideos}
      />

      <SocialSidebar />

      <main>
        <HomeNewsShowcase
          articles={articles}
          videos={videos}
          reporters={reporters}
        />
      </main>

      <Footer />
    </>
  );
}