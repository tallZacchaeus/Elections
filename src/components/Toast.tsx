"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Check } from "./Icons";

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { toast, showToast };
}

export function Toast({ message }: { message: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 14, xPercent: -50 },
        { opacity: 1, y: 0, xPercent: -50, duration: 0.3, ease: "power3.out" },
      );
    }
  }, [message]);

  if (!message) return null;
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#16241C",
        color: "#F4F1E6",
        padding: "13px 22px",
        borderRadius: 11,
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: "0 14px 36px rgba(0,0,0,.3)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Check width={17} height={17} stroke="#7FE0A5" strokeWidth={2.4} />
      {message}
    </div>
  );
}
