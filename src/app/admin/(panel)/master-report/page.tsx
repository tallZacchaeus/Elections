"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SHEETS = [
  { name: "Summary", desc: "Institution header, eligible voters, votes cast, turnout, win threshold and flagged count." },
  { name: "Results", desc: "Every candidate per position with votes, % of eligible, % of cast, status and declared winner." },
  { name: "Voter levels", desc: "ND vs HND electorate — eligible, voted, not voted and turnout per level." },
  { name: "Roster", desc: "The full voter list with level and whether each has voted (never their choice)." },
  { name: "Flagged attempts", desc: "Matric numbers that tried to vote again, with repeat counts." },
];

export default function MasterReportPage() {
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      // Navigating triggers the file download from the authenticated endpoint.
      window.location.href = "/api/admin/master-report";
    } finally {
      // Give the browser a moment to start the download before re-enabling.
      setTimeout(() => setDownloading(false), 2500);
    }
  }

  return (
    <Reveal>
      <PageHeader
        title="Master report"
        subtitle="One Excel workbook with every analysis on its own sheet."
      />

      <Card className="max-w-2xl gap-5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet className="size-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Consolidated election report
            </h3>
            <p className="text-sm text-muted-foreground">
              Downloads as a single <strong>.xlsx</strong> file — each analysis is a separate sheet.
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          {SHEETS.map((s) => (
            <li key={s.name} className="flex items-start gap-2.5 text-sm">
              <Check className="mt-0.5 size-4 flex-none text-primary" />
              <span>
                <span className="font-semibold text-foreground">{s.name}</span>
                <span className="text-muted-foreground"> — {s.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <div>
          <Button onClick={download} disabled={downloading} size="lg" className="gap-2">
            <Download className="size-4" />
            {downloading ? "Preparing…" : "Download master report (.xlsx)"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            A CSV can only hold a single sheet, so the multi-sheet report is provided as Excel.
            It opens in Excel, Google Sheets and LibreOffice.
          </p>
        </div>
      </Card>
    </Reveal>
  );
}
