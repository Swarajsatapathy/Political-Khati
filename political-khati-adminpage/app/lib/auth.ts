"use client";

import { useEffect, useRef } from "react";

const TOKEN_KEY = "politicalKhatiAdminToken";
const USERNAME_KEY = "politicalKhatiAdminUsername";
const LAST_ACTIVITY_KEY = "politicalKhatiAdminLastActivity";

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAdminUsername(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(USERNAME_KEY);
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, username: string): void {
  if (typeof window === "undefined") return;

  // Clear legacy localStorage data if any exists
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    // Ignore storage errors
  }

  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USERNAME_KEY, username);
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // Ignore storage errors
  }

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function recordActivity(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

export function getLastActivity(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    return stored ? Number(stored) : 0;
  } catch {
    return 0;
  }
}

export function isSessionTimedOut(): boolean {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  return Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS;
}

interface UseInactivityTimeoutOptions {
  onTimeout: () => void;
  enabled?: boolean;
}

export function useInactivityTimeout({
  onTimeout,
  enabled = true,
}: UseInactivityTimeoutOptions) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Check timeout right away on mount
    if (getAdminToken()) {
      if (isSessionTimedOut()) {
        clearAdminSession();
        onTimeoutRef.current();
        return;
      }
      recordActivity();
    }

    let lastRecordedTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle activity updates to once every 2 seconds
      if (now - lastRecordedTime > 2000) {
        lastRecordedTime = now;
        recordActivity();
      }
    };

    const checkTimeout = () => {
      const token = getAdminToken();
      if (token && isSessionTimedOut()) {
        clearAdminSession();
        onTimeoutRef.current();
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkTimeout();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkTimeout);

    // Periodically verify inactivity every 5 seconds
    const intervalId = window.setInterval(checkTimeout, 5000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkTimeout);
      window.clearInterval(intervalId);
    };
  }, [enabled]);
}

