"use client";

import Link from "next/link";
import { LogoBadge } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-14">
      <Reveal stagger={0.09} y={18} className="w-full max-w-lg">
        <Card className="text-center">
          <CardContent className="flex flex-col items-center px-6 py-10 sm:px-10">
            <div className="mb-6 flex justify-center">
              <LogoBadge size={84} />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Secure Electronic Ballot
            </p>

            <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h1>

            <p className="mt-3 text-base text-muted-foreground">
              {faculty} · {department}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{institution}</p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  votingOpen ? "bg-foreground" : "bg-muted-foreground/50"
                )}
              />
              {votingOpen ? "Voting is open" : "Voting is closed"}
            </div>

            <div className="mt-8 w-full">
              {votingOpen ? (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/vote">Cast your vote</Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" disabled>
                  Voting is closed
                </Button>
              )}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              One vote per matric number
            </p>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
