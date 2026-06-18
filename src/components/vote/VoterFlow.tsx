"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Lock,
  Eye,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Leaf,
  CheckCircle2,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  level: string;
  avatarBg: string;
  manifesto: string;
  photoUrl?: string | null;
}
interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}
interface BallotData {
  votingOpen: boolean;
  stats: { positions: number; candidates: number; eligible: number };
  election: {
    institution: string;
    faculty: string;
    department: string;
    title: string;
    opensAt: string | null;
    closesAt: string | null;
  };
  positions: Position[];
}

type View = "landing" | "login" | "ballot" | "review" | "success" | "flagged";
type ModalState =
  | (Candidate & { positionTitle: string; posId: string })
  | null;

const ABSTAIN = "__abstain__";

function fmt(dt: string | null): string {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export function VoterFlow() {
  const [data, setData] = useState<BallotData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<View>("landing");

  const [matricInput, setMatricInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [userName, setUserName] = useState("Student");
  const [ballotIndex, setBallotIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [receipt, setReceipt] = useState("");
  const [flaggedMatric, setFlaggedMatric] = useState("");
  const [flagRef, setFlagRef] = useState("");

  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    fetch("/api/ballot")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setLoadError(true));
  }, []);

  function go(v: View) {
    setView(v);
    window.scrollTo(0, 0);
  }

  async function submitLogin() {
    const raw = matricInput.trim();
    if (!raw) {
      setLoginError("Please enter your matriculation number.");
      return;
    }
    setVerifying(true);
    setLoginError("");
    try {
      const res = await fetch("/api/voter/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matric: raw }),
      });
      const json = await res.json();
      if (json.status === "ok") {
        setUserName(json.voter.name);
        setBallotIndex(0);
        setSelections({});
        go("ballot");
      } else if (json.status === "flagged") {
        setFlaggedMatric(json.matric);
        setFlagRef(json.reference);
        go("flagged");
      } else {
        setLoginError(json.message ?? "We couldn't verify that number.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function submitBallot() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/voter/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      const json = await res.json();
      if (res.ok) {
        setReceipt(json.receipt);
        setUserName(json.name ?? userName);
        go("success");
      } else if (res.status === 409) {
        setFlaggedMatric("your number");
        setFlagRef("—");
        go("flagged");
      } else {
        setLoginError(json.error ?? "Submission failed.");
        go("login");
      }
    } catch {
      alert("Network error submitting your ballot. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <Centered>
        <p className="text-muted-foreground">
          Unable to load the ballot. Please refresh the page.
        </p>
      </Centered>
    );
  }
  if (!data) {
    return (
      <Centered>
        <Leaf className="size-10 text-muted-foreground" strokeWidth={1.6} />
        <p className="mt-3.5 text-muted-foreground">Loading the ballot…</p>
      </Centered>
    );
  }

  const positions = data.positions;
  const idx = Math.min(ballotIndex, positions.length - 1);
  const pos = positions[idx];

  // ── LANDING ────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div className="min-h-screen bg-background">
        <BrandHeader
          institution={data.election.institution}
          subtitle={`${data.election.department} · ${data.election.title}`}
        />
        <Reveal>
          <div className="mx-auto max-w-[980px] px-6 pt-12 pb-16">
            <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
              <Badge variant={data.votingOpen ? "secondary" : "outline"}>
                <span
                  className={cn(
                    "live-dot mr-1 inline-block size-2 rounded-full",
                    data.votingOpen ? "bg-foreground" : "bg-muted-foreground",
                  )}
                />
                {data.votingOpen ? "Voting open" : "Voting closed"}
              </Badge>
              {data.election.closesAt && (
                <span className="text-sm text-muted-foreground">
                  Closes {fmt(data.election.closesAt)}
                </span>
              )}
            </div>
            <h1 className="font-serif mb-3.5 max-w-[680px] text-[clamp(28px,5vw,40px)] leading-tight font-semibold text-foreground">
              Elect the next executive council of your association
            </h1>
            <p className="mb-8 max-w-[600px] text-base leading-relaxed text-muted-foreground">
              Your ballot is private and counts once. Have your matriculation
              number ready to begin — the process takes about two minutes.
            </p>

            <Button
              size="lg"
              onClick={() => {
                setMatricInput("");
                setLoginError("");
                go("login");
              }}
              disabled={!data.votingOpen}
              className="h-12 px-7 text-base"
            >
              {data.votingOpen ? "Proceed to verification" : "Voting is closed"}
              <ArrowRight className="size-[18px]" strokeWidth={2.4} />
            </Button>

            <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
              <Stat n={String(data.stats.positions)} label="Positions on the ballot" />
              <Stat n={String(data.stats.candidates)} label="Accredited candidates" />
              <Stat n={String(data.stats.eligible)} label="Eligible voters" />
              <Stat n="~2 min" label="Average time to vote" />
            </div>

            <div className="mt-9 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[18px]">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    How voting works
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3.5">
                  <Step n={1} text="Enter your matriculation number to confirm eligibility." />
                  <Step n={2} text="Choose one candidate for each position, one page at a time." />
                  <Step n={3} text="Review your choices and submit. You receive a sealed receipt." />
                </CardContent>
              </Card>
              <Card className="bg-foreground text-background ring-0">
                <CardHeader>
                  <CardTitle className="font-serif text-lg text-background">
                    Your vote is protected
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3.5">
                  <Protect icon={<Shield className="size-[18px]" strokeWidth={2.2} />} bold="One vote per matric." text=" A second attempt is automatically flagged." />
                  <Protect icon={<Lock className="size-[18px]" strokeWidth={2.2} />} bold="Anonymous ballot." text=" Your identity is never linked to your selections." />
                  <Protect icon={<Eye className="size-[18px]" strokeWidth={2.2} />} bold="Independently observed." text=" Accredited observers monitor the live count." />
                </CardContent>
              </Card>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <Backdrop>
        <Reveal style={{ width: "100%", maxWidth: 430 }}>
          <div className="mb-6 text-center">
            <div className="mb-3.5 inline-flex size-14 items-center justify-center rounded-full bg-muted">
              <Leaf className="size-[30px] text-foreground" strokeWidth={1.6} />
            </div>
            <h1 className="font-serif mb-1.5 text-2xl font-semibold text-foreground">
              Verify your eligibility
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter the matriculation number on your student record.
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col gap-2">
              <Label htmlFor="matric">Matriculation number</Label>
              <Input
                id="matric"
                value={matricInput}
                onChange={(e) => {
                  setMatricInput(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && submitLogin()}
                placeholder="e.g. PUB/22/014"
                autoFocus
                className="h-12 text-base tracking-wider uppercase"
              />
              {loginError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle strokeWidth={2.2} />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={submitLogin}
                disabled={verifying}
                className="mt-4 h-12 w-full text-base"
              >
                {verifying ? "Verifying…" : "Verify & continue"}
              </Button>
              <Separator className="mt-4" />
              <div className="text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Demo numbers:</strong> PUB/22/014
                · PUB/22/027 · PUB/23/102
                <br />
                <span className="text-foreground">PUB/22/001</span> has already
                voted — try it to see the duplicate-vote flag.
              </div>
            </CardContent>
          </Card>
          <BackHome />
        </Reveal>
      </Backdrop>
    );
  }

  // ── BALLOT ─────────────────────────────────────────────────────────────
  if (view === "ballot" && pos) {
    const sel = selections[pos.id];
    const progressPct = Math.round(((idx + 1) / positions.length) * 100);
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card px-6 py-4">
          <div className="mx-auto max-w-[860px]">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Voting as <strong className="text-foreground">{userName}</strong>
              </span>
              <span className="text-sm font-semibold text-foreground">
                Position {idx + 1} of {positions.length}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <Reveal
          animationKey={idx}
          stagger={0.06}
          className="mx-auto max-w-[860px] px-6 pt-9 pb-[130px]"
        >
          <div className="mb-7 text-center">
              <div className="mb-2 text-xs font-bold tracking-[0.22em] text-muted-foreground uppercase">
                Select one candidate
              </div>
              <h2 className="font-serif text-[clamp(24px,5vw,32px)] font-semibold text-foreground">
                {pos.title}
              </h2>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              {pos.candidates.map((c) => {
                const selected = sel === c.id;
                return (
                  <Card
                    key={c.id}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [pos.id]: c.id }))
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") &&
                      setSelections((s) => ({ ...s, [pos.id]: c.id }))
                    }
                    className={cn(
                      "relative cursor-pointer p-5 transition-all outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "ring-2 ring-foreground"
                        : "ring-1 ring-border hover:ring-foreground/30",
                    )}
                  >
                    {selected && (
                      <div className="pop-in absolute top-3 right-3 flex size-[26px] items-center justify-center rounded-full bg-foreground">
                        <Check className="size-[15px] text-background" strokeWidth={3} />
                      </div>
                    )}
                    <Avatar
                      name={c.name}
                      size={74}
                      bg={c.avatarBg}
                      photoUrl={c.photoUrl}
                      fontSize={26}
                      style={{ marginBottom: 14 }}
                    />
                    <div className="font-serif text-lg leading-tight font-semibold text-foreground">
                      {c.name}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {c.level}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ ...c, positionTitle: pos.title, posId: pos.id });
                      }}
                      className="mt-3.5"
                    >
                      View manifesto
                    </Button>
                  </Card>
                );
              })}
            </div>

          <Button
            variant="link"
            onClick={() =>
              setSelections((s) => ({ ...s, [pos.id]: ABSTAIN }))
            }
            className="mx-auto mt-5.5 block text-muted-foreground"
          >
            I prefer to abstain for this position
          </Button>
        </Reveal>

        <div className="fixed inset-x-0 bottom-0 border-t bg-card px-6 py-3.5 shadow-[0_-6px_20px_rgba(0,0,0,.06)]">
          <div className="mx-auto flex max-w-[860px] items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (idx > 0) {
                  setBallotIndex(idx - 1);
                  window.scrollTo(0, 0);
                } else go("landing");
              }}
              className="h-11"
            >
              <ArrowLeft className="size-4" strokeWidth={2.4} />
              {idx === 0 ? "Back" : "Previous"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {sel ? (sel === ABSTAIN ? "Abstained" : "Selection made") : "No selection yet"}
            </span>
            <Button
              onClick={() => {
                if (idx < positions.length - 1) {
                  setBallotIndex(idx + 1);
                  window.scrollTo(0, 0);
                } else go("review");
              }}
              className="h-11"
            >
              {idx === positions.length - 1 ? "Review ballot" : "Next position"}
              <ArrowRight className="size-4" strokeWidth={2.4} />
            </Button>
          </div>
        </div>

        <ManifestoModal
          modal={modal}
          canSelect
          onClose={() => setModal(null)}
          onSelect={() => {
            if (modal) {
              setSelections((s) => ({ ...s, [modal.posId]: modal.id }));
              setModal(null);
            }
          }}
        />
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────
  if (view === "review") {
    return (
      <div className="min-h-screen bg-background px-5 pt-10 pb-[70px]">
        <Reveal style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="mb-7 text-center">
            <div className="mb-2 text-xs font-bold tracking-[0.22em] text-muted-foreground uppercase">
              Final step
            </div>
            <h2 className="font-serif mb-1.5 text-3xl font-semibold text-foreground">
              Review your ballot
            </h2>
            <p className="text-sm text-muted-foreground">
              Confirm your choices below. Once submitted, your ballot is sealed
              and cannot be changed.
            </p>
          </div>
          <Card className="gap-0 p-0">
            {positions.map((p, i) => {
              const pick = selections[p.id];
              const cand = p.candidates.find((c) => c.id === pick);
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-4",
                    i < positions.length - 1 && "border-b",
                  )}
                >
                  {cand ? (
                    <Avatar
                      name={cand.name}
                      size={44}
                      bg={cand.avatarBg}
                      photoUrl={cand.photoUrl}
                      fontSize={16}
                    />
                  ) : (
                    <div className="font-serif flex size-11 flex-none items-center justify-center rounded-full bg-muted text-base font-semibold text-muted-foreground">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold tracking-[0.06em] text-muted-foreground uppercase">
                      {p.title}
                    </div>
                    <div
                      className={cn(
                        "font-serif text-base font-semibold",
                        cand ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {cand ? cand.name : "No selection (abstained)"}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBallotIndex(positions.indexOf(p));
                      go("ballot");
                    }}
                  >
                    Change
                  </Button>
                </div>
              );
            })}
          </Card>
          <Button
            onClick={submitBallot}
            disabled={submitting}
            className="mt-5 h-14 w-full text-base"
          >
            <ShieldCheck className="size-[19px]" strokeWidth={2.2} />
            {submitting ? "Sealing your ballot…" : "Submit my sealed ballot"}
          </Button>
          <Button
            variant="link"
            onClick={() => go("ballot")}
            className="mx-auto mt-3.5 block text-muted-foreground"
          >
            Back to selection
          </Button>
        </Reveal>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <Backdrop>
        <Reveal style={{ width: "100%", maxWidth: 440 }}>
          <div className="text-center">
            <div className="pop-in mb-6 inline-flex size-[92px] items-center justify-center rounded-full border-2 border-foreground/20 bg-muted">
              <CheckCircle2 className="size-12 text-foreground" strokeWidth={2} />
            </div>
            <h1 className="font-serif mb-3 text-3xl font-semibold text-foreground">
              Your vote has been recorded
            </h1>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              Thank you, {userName}. Your ballot has been sealed and added to the
              count. This matriculation number can no longer vote.
            </p>
            <Card className="bg-muted/40">
              <CardContent>
                <div className="mb-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  Your verification receipt
                </div>
                <div className="font-serif text-2xl font-semibold tracking-[0.08em] text-foreground">
                  {receipt}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Keep this code. Observers can confirm your ballot was counted
                  without revealing your choices.
                </div>
              </CardContent>
            </Card>
            <Button asChild className="mt-6">
              <Link href="/">Return to home</Link>
            </Button>
          </div>
        </Reveal>
      </Backdrop>
    );
  }

  // ── FLAGGED ────────────────────────────────────────────────────────────
  if (view === "flagged") {
    return (
      <Backdrop>
        <Reveal style={{ width: "100%", maxWidth: 440 }}>
          <div className="text-center">
            <div className="pop-in mb-5.5 inline-flex size-[88px] items-center justify-center rounded-full border-2 border-destructive/40 bg-destructive/10">
              <AlertTriangle className="size-11 text-destructive" strokeWidth={2.2} />
            </div>
            <div className="mb-2.5 text-xs font-bold tracking-[0.2em] text-destructive uppercase">
              Duplicate vote blocked
            </div>
            <h1 className="font-serif mb-3 text-[28px] font-semibold text-foreground">
              This number has already voted
            </h1>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              Matric <strong className="text-foreground">{flaggedMatric}</strong>{" "}
              cast a ballot at an earlier time. Each matriculation number is
              permitted exactly one vote, so this attempt has been recorded and
              flagged for review.
            </p>
            <Alert className="text-left">
              <AlertDescription>
                If you believe this is an error, contact the electoral committee
                at the Department of Public Administration with your student ID.
                This incident reference:{" "}
                <strong className="text-foreground">{flagRef}</strong>
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/">Return to home</Link>
            </Button>
          </div>
        </Reveal>
      </Backdrop>
    );
  }

  return null;
}

// ── Shared presentational bits ─────────────────────────────────────────────

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      {children}
    </div>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-5 py-10">
      {children}
    </div>
  );
}

function BrandHeader({
  institution,
  subtitle,
}: {
  institution: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3.5 bg-foreground px-6 py-[18px] text-background">
      <div className="flex size-[42px] flex-none items-center justify-center rounded-full bg-background/10">
        <Leaf className="size-6" strokeWidth={1.8} />
      </div>
      <div className="leading-tight">
        <div className="font-serif text-base font-semibold">{institution}</div>
        <div className="text-xs opacity-70">{subtitle}</div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <Card>
      <CardContent>
        <div className="font-serif text-3xl font-semibold text-foreground">{n}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-6 flex-none items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
        {n}
      </span>
      <div className="text-sm leading-normal text-muted-foreground">{text}</div>
    </div>
  );
}

function Protect({
  icon,
  bold,
  text,
}: {
  icon: React.ReactNode;
  bold: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex-none opacity-80">{icon}</span>
      <div className="text-sm leading-normal">
        <strong>{bold}</strong>
        {text}
      </div>
    </div>
  );
}

function BackHome() {
  return (
    <Link
      href="/"
      className="mt-4 block text-center text-sm text-muted-foreground underline underline-offset-[3px]"
    >
      Return to home
    </Link>
  );
}

function ManifestoModal({
  modal,
  canSelect,
  onClose,
  onSelect,
}: {
  modal: ModalState;
  canSelect: boolean;
  onClose: () => void;
  onSelect: () => void;
}) {
  return (
    <Dialog open={!!modal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 sm:max-w-md">
        {modal && (
          <>
            <DialogHeader className="flex-row items-center gap-4 bg-muted p-6">
              <Avatar
                name={modal.name}
                size={72}
                bg={modal.avatarBg}
                photoUrl={modal.photoUrl}
                fontSize={26}
              />
              <div>
                <div className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                  {modal.positionTitle}
                </div>
                <DialogTitle className="font-serif mt-0.5 text-xl">
                  {modal.name}
                </DialogTitle>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {modal.level}
                </div>
              </div>
            </DialogHeader>
            <div className="px-6 pb-6">
              <div className="mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
                Manifesto
              </div>
              <p className="mb-[18px] text-sm leading-relaxed text-foreground">
                {modal.manifesto}
              </p>
              <DialogFooter className="m-0 flex-row gap-2.5 border-0 bg-transparent p-0">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                  Close
                </Button>
                {canSelect && (
                  <Button onClick={onSelect} className="flex-1">
                    Select this candidate
                  </Button>
                )}
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
