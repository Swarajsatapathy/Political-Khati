"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ArticlesSection from "./components/ArticlesSection";
import VideosSection from "./components/VideosSection";
import ReportersSection from "./components/ReportersSection";
import {
  clearAdminSession,
  getAdminToken,
  getAdminUsername,
  isSessionTimedOut,
  recordActivity,
  useInactivityTimeout,
} from "../lib/auth";

type DashboardTab =
  | "articles"
  | "videos"
  | "reporters";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<DashboardTab>("articles");

  const [username, setUsername] =
    useState("Admin");

  const [
    isCheckingAuth,
    setIsCheckingAuth,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | Inactivity Timeout (15 minutes)
  |--------------------------------------------------------------------------
  */
  useInactivityTimeout({
    onTimeout: () => {
      router.replace("/login?reason=inactivity");
    },
    enabled: !isCheckingAuth,
  });

  /*
  |--------------------------------------------------------------------------
  | Verify Admin Login
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const verifyLogin = async () => {
      const token = getAdminToken();

      if (!token || isSessionTimedOut()) {
        clearAdminSession();
        router.replace(
          isSessionTimedOut() ? "/login?reason=inactivity" : "/login"
        );
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/verify`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            "Session expired"
          );
        }

        recordActivity();

        setUsername(
          result?.data?.username ||
            getAdminUsername() ||
            "Admin"
        );
      } catch {
        clearAdminSession();
        router.replace("/login?reason=expired");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    void verifyLogin();
  }, [router]);

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = () => {
    clearAdminSession();
    router.replace("/login");
  };

  /*
  |--------------------------------------------------------------------------
  | Authentication Loader
  |--------------------------------------------------------------------------
  */

  if (isCheckingAuth) {
    return (
      <main className="authLoadingPage">
        <div className="loadingSpinner" />

        <p>
          Checking your session...
        </p>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  return (
    <main className="dashboardPage">
      {/* --------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* --------------------------------------------------------------- */}

      <header className="adminHeader">
        <div className="adminHeaderInner">
          <div className="adminBrand">
            <div className="adminLogoWrapper">
              <Image
                src="/political-khati-logo.png"
                alt="Political Khati"
                width={58}
                height={58}
                className="adminLogo"
                priority
              />
            </div>

            <div>
              <h1>
                Political Khati
              </h1>

              <p>
                Admin Dashboard
              </p>
            </div>
          </div>

          <div className="adminAccount">
            <span>
              {username}
            </span>

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

      {/* --------------------------------------------------------------- */}
      {/* Dashboard Content                                               */}
      {/* --------------------------------------------------------------- */}

      <div className="dashboardContainer">
        {/* ------------------------------------------------------------- */}
        {/* Tabs                                                          */}
        {/* ------------------------------------------------------------- */}

        <nav
          className="dashboardTabs"
          aria-label="Dashboard sections"
        >
          <button
            type="button"
            className={
              activeTab === "articles"
                ? "dashboardTab active"
                : "dashboardTab"
            }
            onClick={() =>
              setActiveTab("articles")
            }
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
            onClick={() =>
              setActiveTab("videos")
            }
          >
            Video News
          </button>

          <button
            type="button"
            className={
              activeTab === "reporters"
                ? "dashboardTab active"
                : "dashboardTab"
            }
            onClick={() =>
              setActiveTab("reporters")
            }
          >
            Reporters
          </button>
        </nav>

        {/* ------------------------------------------------------------- */}
        {/* Sections                                                      */}
        {/* ------------------------------------------------------------- */}

        {activeTab === "articles" && (
          <ArticlesSection />
        )}

        {activeTab === "videos" && (
          <VideosSection />
        )}

        {activeTab === "reporters" && (
          <ReportersSection />
        )}
      </div>
    </main>
  );
}
