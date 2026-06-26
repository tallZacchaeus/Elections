"use client";

import { useEffect, useState } from "react";

/**
 * Polls an endpoint on an interval so views update without a manual refresh.
 * Also refetches when the tab regains focus. Returns the latest parsed JSON.
 *
 * Resilient by design: only one request is in flight at a time, and each
 * request is aborted before the next tick so a slow/unreachable endpoint
 * (e.g. during a deploy) cannot pile up timed-out requests.
 */
export function useLiveData<T>(url: string, intervalMs = 8000): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    let inFlight = false;

    const load = () => {
      if (inFlight) return; // never overlap requests
      inFlight = true;
      const controller = new AbortController();
      // Abort a stuck request comfortably before the next interval fires.
      const timeout = setTimeout(() => controller.abort(), Math.max(3000, intervalMs - 1500));
      fetch(url, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (active && d != null) setData(d as T);
        })
        .catch(() => {})
        .finally(() => {
          clearTimeout(timeout);
          inFlight = false;
        });
    };

    load();
    const id = setInterval(load, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, intervalMs]);

  return data;
}
