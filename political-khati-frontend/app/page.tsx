export const dynamic = "force-dynamic";

import FlashNewsBar from "../components/FlashNewsBar";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HomeNewsShowcase from "../components/HomeNewsShowcase";
import SocialSidebar from "../components/SocialSidebar";

import {
  getFlashArticles,
  getPublishedArticles,
  getPublishedVideos,
} from "../lib/api";

export default async function HomePage() {
  const [flashArticles, articles, videos] = await Promise.all([
    getFlashArticles(),
    getPublishedArticles(10),
    getPublishedVideos(10),
  ]);

  return (
    <>
      <Header />

      <FlashNewsBar articles={flashArticles} />

      <SocialSidebar />

      <main>
        <HomeNewsShowcase
          articles={articles}
          videos={videos}
        />
      </main>

      <Footer />
    </>
  );
}