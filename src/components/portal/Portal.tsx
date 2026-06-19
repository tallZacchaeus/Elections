"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { LogoBadge } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PortalProps {
  title: string;
  faculty: string;
  department: string;
  institution: string;
  votingOpen: boolean;
}

export function Portal({
  title,
  faculty,
  department,
  institution,
  votingOpen,
}: PortalProps) {
  const root = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set([cardRef.current, "[data-reveal]"], { autoAlpha: 1 });
        return;
      }

      // Entrance timeline: card rises in, then its contents stagger up.
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(cardRef.current, { autoAlpha: 0, y: 28, scale: 0.96, duration: 0.6 })
        .from(
          "[data-reveal]",
          { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.08 },
          "-=0.25",
        );

      // Gentle continuous float on the logo badge.
      gsap.to(logoRef.current, {
        y: -7,
        duration: 2.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Pointer-driven hover lift on the card.
  function lift(on: boolean) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.to(cardRef.current, {
      y: on ? -6 : 0,
      scale: on ? 1.012 : 1,
      duration: 0.35,
      ease: "power2.out",
    });
  }

  return (
    <div
      ref={root}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-14"
    >
      {/* Soft brand glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(200,147,42,0.16), transparent 60%), radial-gradient(70% 60% at 50% 110%, rgba(14,90,55,0.18), transparent 60%)",
        }}
      />

      <div
        className="w-full max-w-lg"
        onMouseEnter={() => lift(true)}
        onMouseLeave={() => lift(false)}
      >
        <Card ref={cardRef} className="border-secondary/60 text-center">
          <CardContent className="flex flex-col items-center px-6 py-10 sm:px-10">
            <div ref={logoRef} data-reveal className="mb-6 flex justify-center">
              <LogoBadge size={88} />
            </div>

            <p
              data-reveal
              className="mb-3 text-xs font-bold uppercase tracking-[0.32em] text-primary"
            >
              Secure Electronic Ballot
            </p>

            <h1
              data-reveal
              className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl"
            >
              {title}
            </h1>

            <p data-reveal className="mt-3 text-base text-muted-foreground">
              {faculty} · {department}
            </p>
            <p data-reveal className="mt-1 text-sm text-muted-foreground">
              {institution}
            </p>

            <div
              data-reveal
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground"
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  votingOpen ? "live-dot bg-primary" : "bg-muted-foreground/50",
                )}
              />
              {votingOpen ? "Voting is open" : "Voting is closed"}
            </div>

            <div data-reveal className="mt-8 w-full">
              {votingOpen ? (
                <Button
                  asChild
                  size="lg"
                  className="w-full text-base font-semibold shadow-md shadow-primary/20 sm:w-auto sm:px-10"
                >
                  <Link href="/vote">Cast your vote</Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto sm:px-10" disabled>
                  Voting is closed
                </Button>
              )}
            </div>

            <p data-reveal className="mt-6 text-xs text-muted-foreground">
              One vote per matric number
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
