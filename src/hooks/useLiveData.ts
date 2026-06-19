"use client";

import { useEffect, useState } from "react";

/**
 * Polls an endpoint on an interval so views update without a manual refresh.
 * Also refetches when the tab regains focus. Returns the latest parsed JSON.
 */
export function useLiveData<T>(url: string, intervalMs = 8000): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (active && d != null) setData(d as T);
        })
        .catch(() => {});

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
