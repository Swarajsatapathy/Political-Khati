"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ArticlesSection from "./components/ArticlesSection";
import VideosSection from "./components/VideosSection";

type DashboardTab = "articles" | "videos";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5010";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<DashboardTab>("articles");

  const [username, setUsername] = useState("Admin");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyLogin = async () => {
      const token = localStorage.getItem(
        "politicalKhatiAdminToken"
      );

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error("Session expired");
        }

        setUsername(
          result?.data?.username ||
            localStorage.getItem(
              "politicalKhatiAdminUsername"
            ) ||
            "Admin"
        );
      } catch {
        localStorage.removeItem("politicalKhatiAdminToken");
        localStorage.removeItem(
          "politicalKhatiAdminUsername"
        );

        router.replace("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyLogin();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("politicalKhatiAdminToken");
    localStorage.removeItem("politicalKhatiAdminUsername");

    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <main className="authLoadingPage">
        <div className="loadingSpinner" />
        <p>Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="dashboardPage">
      <header className="adminHeader">
        <div className="adminHeaderInner">
          <div className="adminBrand">
            <div className="adminLogoWrapper">
              <Image
                src="/political-khati-logo.png"
                alt="Political Khati"
                width={60}
                height={60}
                className="adminLogo"
                priority
              />
            </div>

            <div>
              <h1>Political Khati</h1>
              <p>Admin Dashboard</p>
            </div>
          </div>

          <div className="adminAccount">
            <span>{username}</span>

            <button
              type="button"
              className="logoutButton"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboardContainer">
        <nav className="dashboardTabs" aria-label="Dashboard sections">
          <button
            type="button"
            className={
              activeTab === "articles"
                ? "dashboardTab active"
                : "dashboardTab"
            }
            onClick={() => setActiveTab("articles")}
          >
            Web News
          </button>

          <button
            type="button"
            className={
              activeTab === "videos"
                ? "dashboardTab active"
                : "dashboardTab"
            }
            onClick={() => setActiveTab("videos")}
          >
            Video News
          </button>
        </nav>

        {activeTab === "articles" ? (
          <ArticlesSection />
        ) : (
          <VideosSection />
        )}
      </div>
    </main>
  );
}