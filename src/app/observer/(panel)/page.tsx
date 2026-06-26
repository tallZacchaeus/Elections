"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { ResultsBars, type ResultPosition } from "@/components/results/ResultsBars";
import { ResultsAnalysis, type AnalysisData } from "@/components/results/ResultsAnalysis";
import { LevelBreakdown } from "@/components/results/LevelBreakdown";
import { useLiveData } from "@/hooks/useLiveData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, FileDown, LogOut } from "lucide-react";

export default function ObserverPage() {
  const router = useRouter();
  const data = useLiveData<AnalysisData>("/api/results");

  function exportAs(format: "csv" | "xls") {
    window.location.href = `/api/export?format=${format}`;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print flex flex-wrap items-center gap-3.5 bg-foreground px-[30px] py-4 text-background">
        <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-background/10">
          <Eye className="size-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold">Observer Portal</div>
          <div className="text-xs opacity-70">
            Read-only access · accredited monitor
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge
            variant="secondary"
            className="gap-2 bg-background/15 text-background"
          >
            <span className="live-dot inline-block size-2 rounded-full bg-background" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="border-background/20 bg-background/10 text-background hover:bg-background/20 hover:text-background"
          >
            <LogOut className="size-3.5" /> Sign out
          </Button>
        </div>
      </div>

      <Reveal style={{ maxWidth: 920, margin: "0 auto" }}>
        <div className="px-6 pt-[30px] pb-[60px]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
            <div>
              <h1 className="font-serif mb-1 text-[26px] font-semibold text-foreground">
                Election overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Live status and result analysis. Editing is disabled for observers.
              </p>
            </div>
            <div className="no-print flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportAs("csv")}>
                <Download className="size-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportAs("xls")}>
                <Download className="size-3.5" /> Excel
              </Button>
              <Button asChild size="sm">
                <Link href="/observer/report" target="_blank">
                  <FileDown className="size-3.5" /> PDF report
                </Link>
              </Button>
            </div>
          </div>

          {!data ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-40" />
            </div>
          ) : !data.election ? (
            <p className="text-muted-foreground">
              There is no election to display results for yet.
            </p>
          ) : (
            <Reveal stagger={0.07} y={16}>
              <div className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
                <StatCard label="Votes cast" value={data.votesCast} />
                <StatCard label="Eligible voters" value={data.totalEligible} />
                <StatCard label="Turnout" value={`${data.turnoutPct}%`} />
                <StatCard label={`Win line (${data.thresholdPct}%)`} value={`${data.thresholdVotes}`} />
              </div>

              {data.levels?.length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 font-display text-xl font-bold text-foreground">
                    Voters by level (ND / HND)
                  </h2>
                  <LevelBreakdown levels={data.levels} />
                </div>
              )}

              <ResultsBars positions={data.positions as unknown as ResultPosition[]} />

              <div className="mt-7 mb-3">
                <h2 className="font-display text-xl font-bold text-foreground">Result analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Each candidate&apos;s standing against the {data.thresholdPct}% win threshold.
                </p>
              </div>
              <ResultsAnalysis data={data} />
            </Reveal>
          )}
          <Link
            href="/"
            className="no-print mt-6 inline-block text-sm text-muted-foreground underline underline-offset-[3px]"
          >
            Return to home
          </Link>
        </div>
      </Reveal>
    </div>
  );
}

function StatCard({
  label,
  value,
  muted,
}: {
  label: string;
  value: number | string;
  muted?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <div
          className={cn(
            "font-serif text-3xl font-semibold",
            muted ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
