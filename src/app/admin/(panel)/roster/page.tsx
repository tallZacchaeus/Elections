"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText } from "lucide-react";

interface Voter {
  matricNumber: string;
  fullName: string;
  hasVoted: boolean;
}

export default function RosterPage() {
  const { toast, showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/roster");
    const json = await res.json();
    setVoters(json.voters ?? []);
    setTotal(json.total ?? 0);
    setVotedCount(json.votedCount ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text, replace: true }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast(`Roster uploaded · ${json.imported} voters validated.`);
        load();
      } else {
        showToast(json.error ?? "Upload failed.");
      }
    } catch {
      showToast("Could not read that file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const csv = "matric_number,full_name\nPUB/22/014,Chinedu Okeke\nPUB/22/027,Fatima Bello\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const shown = voters.slice(0, 12);

  return (
    <Reveal>
      <PageHeader
        title="Voter roster"
        subtitle="Upload the eligibility dataset. Only matriculation numbers on this list may vote."
        right={
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            Download CSV template
          </Button>
        }
      />

      <input ref={fileRef} type="file" accept=".csv,text/csv,.xlsx" onChange={onFile} className="hidden" />

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`mb-6 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:bg-muted/40 ${uploading ? "cursor-wait" : "cursor-pointer"}`}
      >
        <div className="mb-3.5 inline-flex size-14 items-center justify-center rounded-xl bg-muted">
          <Upload className="size-6 text-foreground" />
        </div>
        <div className="mb-1.5 text-base font-semibold text-foreground">
          {uploading ? "Uploading…" : "Drop your CSV file here, or click to browse"}
        </div>
        <div className="text-sm text-muted-foreground">
          accepts .csv · columns: <code>matric_number</code>, <code>full_name</code> · uploading replaces the current roster
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading roster…</p>
      ) : total === 0 ? (
        <p className="text-muted-foreground">No voters loaded yet. Upload a roster to begin.</p>
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-foreground" />
              <div>
                <div className="text-sm font-semibold text-foreground">Current roster</div>
                <div className="text-xs text-muted-foreground">{total} eligible voters · {votedCount} have voted</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Replace file
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matric number</TableHead>
                <TableHead>Full name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((v) => (
                <TableRow key={v.matricNumber}>
                  <TableCell className="font-semibold tracking-wide">{v.matricNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{v.fullName}</TableCell>
                  <TableCell>
                    <Badge variant={v.hasVoted ? "default" : "secondary"}>
                      {v.hasVoted ? "Voted" : "Not voted"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {total > shown.length && (
            <div className="px-5 py-3 text-center text-xs text-muted-foreground">
              Showing first {shown.length} of {total} records
            </div>
          )}
        </Card>
      )}
      <Toast message={toast} />
    </Reveal>
  );
}
