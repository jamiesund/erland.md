"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

const STORAGE_KEY = "va-disable";

function trackingDisabled(url: string) {
  try {
    const current = new URL(url, window.location.origin);
    if (current.searchParams.has("va-disable")) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function dropOwnVisits(event: BeforeSendEvent) {
  if (trackingDisabled(event.url)) return null;
  return event;
}

export function SiteAnalytics() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const node = event.target.closest<HTMLElement>("[data-track]");
      const button = node?.dataset.track;
      if (!button) return;
      track("Click", { button });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <Analytics beforeSend={dropOwnVisits} />;
}
