"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { useToast, Toast } from "@/components/Toast";
import { PageHeader } from "@/components/admin/ui";
import { NoElection } from "@/components/admin/NoElection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, Download, Search } from "lucide-react";

interface Voter {
  matricNumber: string;
  fullName: string;
  hasVoted: boolean;
  votedAt: string | null;
}

type Filter = "all" | "voted" | "not";

function fmt(dt: string | null): string {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function RosterPage() {
  const { toast, showToast } = useToast();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [total, setTotal] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noElection, setNoElection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/admin/roster");
    if (res.status === 409) {
      setNoElection(true);
      setLoading(false);
      return;
    }
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
    triggerDownload(csv, "roster_template.csv");
  }

  function triggerDownload(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const notVotedCount = total - votedCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return voters.filter((v) => {
      if (filter === "voted" && !v.hasVoted) return false;
      if (filter === "not" && v.hasVoted) return false;
      if (q && !v.matricNumber.toLowerCase().includes(q) && !v.fullName.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [voters, filter, query]);

  function exportCsv() {
    const label = filter === "voted" ? "voted" : filter === "not" ? "not-voted" : "all";
    const header = ["Matric number", "Full name", "Status", "Voted at"];
    const lines = [header.map(csvCell).join(",")];
    for (const v of filtered) {
      lines.push(
        [
          v.matricNumber,
          v.fullName,
          v.hasVoted ? "Voted" : "Not voted",
          v.hasVoted ? fmt(v.votedAt) : "",
        ]
          .map((s) => csvCell(String(s)))
          .join(","),
      );
    }
    triggerDownload(lines.join("\n"), `roster-${label}-${Date.now()}.csv`);
  }

  if (noElection) return <NoElection />;

  return (
    <Reveal>
      <PageHeader
        title="Voter roster"
        subtitle="The full eligibility list and who has voted. Ballot choices are never recorded against a voter."
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
        className={`mb-6 rounded-xl border-2 border-dashed border-border bg-card px-6 py-8 text-center transition-colors hover:bg-muted/40 ${uploading ? "cursor-wait" : "cursor-pointer"}`}
      >
        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-muted">
          <Upload className="size-5 text-foreground" />
        </div>
        <div className="mb-1 text-sm font-semibold text-foreground">
          {uploading ? "Uploading…" : "Drop your CSV file here, or click to browse"}
        </div>
        <div className="text-xs text-muted-foreground">
          accepts .csv · columns: <code>matric_number</code>, <code>full_name</code> · uploading replaces the current roster
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading roster…</p>
      ) : total === 0 ? (
        <p className="text-muted-foreground">No voters loaded yet. Upload a roster to begin.</p>
      ) : (
        <Card className="gap-0 overflow-hidden p-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-foreground" />
              <div>
                <div className="text-sm font-semibold text-foreground">Current roster</div>
                <div className="text-xs text-muted-foreground">
                  {total} eligible · {votedCount} voted · {notVotedCount} not voted
                </div>
              </div>
            </div>
            <Button size="sm" onClick={exportCsv} className="gap-2">
              <Download className="size-3.5" />
              Export {filter === "voted" ? "voted" : filter === "not" ? "not-voted" : "all"} ({filtered.length})
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
            <div className="flex gap-1">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                All ({total})
              </FilterButton>
              <FilterButton active={filter === "voted"} onClick={() => setFilter("voted")}>
                Voted ({votedCount})
              </FilterButton>
              <FilterButton active={filter === "not"} onClick={() => setFilter("not")}>
                Not voted ({notVotedCount})
              </FilterButton>
            </div>
            <div className="relative ml-auto w-full max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search matric or name…"
                className="h-9 pl-8"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[560px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Matric number</TableHead>
                  <TableHead>Full name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Voted at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => (
                  <TableRow key={v.matricNumber}>
                    <TableCell className="font-semibold tracking-wide">{v.matricNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{v.fullName}</TableCell>
                    <TableCell>
                      <Badge variant={v.hasVoted ? "default" : "secondary"}>
                        {v.hasVoted ? "Voted" : "Not voted"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.hasVoted ? fmt(v.votedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No voters match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="border-t px-5 py-2.5 text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {total} voters
          </div>
        </Card>
      )}
      <Toast message={toast} />
    </Reveal>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick}>
      {children}
    </Button>
  );
}
