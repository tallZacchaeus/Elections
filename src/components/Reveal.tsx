"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";

interface RevealProps {
  children: ReactNode;
  /** Travel distance in px. */
  y?: number;
  duration?: number;
  delay?: number;
  /** When set, stagger the direct children instead of the wrapper. */
  stagger?: number;
  className?: string;
  style?: CSSProperties;
  /** Re-run the animation whenever this key changes (e.g. ballot step). */
  animationKey?: string | number;
}

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Reveal({
  children,
  y = 14,
  duration = 0.5,
  delay = 0,
  stagger,
  className,
  style,
  animationKey,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (prefersReduced()) {
        gsap.set(el, { opacity: 1 });
        if (stagger != null) gsap.set(el.children, { opacity: 1, y: 0 });
        return;
      }
      if (stagger != null) {
        gsap.set(el, { opacity: 1 });
        gsap.from(el.children, {
          opacity: 0,
          y,
          duration,
          delay,
          stagger,
          ease: "power3.out",
        });
      } else {
        gsap.from(el, { opacity: 0, y, duration, delay, ease: "power3.out" });
      }
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationKey]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
