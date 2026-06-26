"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export interface ResultCandidate {
  id: string;
  name: string;
  votes: number;
  pct: number;
  leading: boolean;
  barColor: string;
}
export interface ResultPosition {
  id: string;
  title: string;
  total: number;
  candidates: ResultCandidate[];
}

export function ResultsBars({ positions }: { positions: ResultPosition[] }) {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const bars = el.querySelectorAll<HTMLElement>("[data-bar]");
      bars.forEach((bar) => {
        const target = bar.dataset.pct ?? "0";
        if (reduce) {
          bar.style.width = `${target}%`;
          return;
        }
        // Animate from the bar's current width to the new target so live
        // updates ease smoothly instead of resetting to zero each poll.
        gsap.to(bar, { width: `${target}%`, duration: 0.85, ease: "power2.out" });
      });
    }, scope);
    return () => ctx.revert();
  }, [positions]);

  return (
    <div ref={scope} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {positions.map((p) => (
        <div key={p.id} style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{p.title}</h3>
            <span style={{ fontSize: 12.5, color: "#8A968C" }}>{p.total} votes</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {p.candidates.map((c) => (
              <div key={c.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#16241C", display: "flex", alignItems: "center", gap: 8 }}>
                    {c.name}
                    {c.leading && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, background: "#C8932A", color: "#16241C", padding: "2px 8px", borderRadius: 999 }}>LEADING</span>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: "#5C6B61" }}>{c.votes} · {c.pct}%</span>
                </div>
                <div style={{ height: 11, background: "#EDEADD", borderRadius: 99, overflow: "hidden" }}>
                  <div data-bar data-pct={c.pct} style={{ height: "100%", background: c.barColor, borderRadius: 99, width: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
