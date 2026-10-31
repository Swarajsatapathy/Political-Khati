"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, setAdminSession } from "../lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5010";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason === "inactivity") {
      return "You were logged out due to 15 minutes of inactivity. Please sign in again.";
    }
    if (reason === "expired") {
      return "Your session has expired. Please sign in again.";
    }
    return "";
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Clear any previous session so login is always required when visiting this page
    clearAdminSession();
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Login failed");
      }

      const token = result?.data?.token;

      if (!token) {
        throw new Error("Login token was not received");
      }

      setAdminSession(
        token,
        result?.data?.admin?.username || username.trim()
      );

      router.replace("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="loginPage">
      <div className="loginBackgroundDecoration loginDecorationRed" />
      <div className="loginBackgroundDecoration loginDecorationBlue" />

      <section className="loginCard">
        <div className="loginLogoWrapper">
          <Image
            src="/political-khati-logo.png"
            alt="Political Khati"
            width={116}
            height={116}
            className="loginLogo"
            priority
          />
        </div>

        <div className="loginHeading">
          <p className="loginEyebrow">ADMINISTRATION</p>
          <h1>Political Khati</h1>
          <p>Sign in to manage web news and video news.</p>
        </div>

        <form className="loginForm" onSubmit={handleLogin}>
          <div className="formGroup">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter admin username"
              autoComplete="username"
              required
            />
          </div>

          <div className="formGroup">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="loginError" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primaryButton loginButton"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="loginFooterText">
          A Srishti News Initiative
        </p>
      </section>
    </main>
  );
}
