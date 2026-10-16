"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresh server-filtered listings when a displayed event ends, including after
// a background tab wakes up. Long delays are capped at the browser timer limit.
export default function EventExpiryRefresh({ expiresAt }: { expiresAt: number | null }) {
  const router = useRouter();

  useEffect(() => {
    if (expiresAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    let refreshed = false;
    const checkExpiry = () => {
      clearTimeout(timer);
      if (refreshed) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        refreshed = true;
        router.refresh();
      } else {
        timer = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      }
    };
    checkExpiry();
    document.addEventListener("visibilitychange", checkExpiry);
    window.addEventListener("focus", checkExpiry);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkExpiry);
      window.removeEventListener("focus", checkExpiry);
    };
  }, [expiresAt, router]);

  return null;
}
