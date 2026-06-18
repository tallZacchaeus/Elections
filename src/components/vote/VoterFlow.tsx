"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { LeafMark } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
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
} from "@/components/Icons";

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
        <p style={{ color: "#46554C" }}>
          Unable to load the ballot. Please refresh the page.
        </p>
      </Centered>
    );
  }
  if (!data) {
    return (
      <Centered>
        <LeafMark size={40} />
        <p style={{ color: "#5C6B61", marginTop: 14 }}>Loading the ballot…</p>
      </Centered>
    );
  }

  const positions = data.positions;
  const idx = Math.min(ballotIndex, positions.length - 1);
  const pos = positions[idx];

  // ── LANDING ────────────────────────────────────────────────────────────
  if (view === "landing") {
    return (
      <div>
        <BrandHeader
          institution={data.election.institution}
          subtitle={`${data.election.department} · ${data.election.title}`}
        />
        <Reveal style={{ maxWidth: 980, margin: "0 auto", padding: "46px 24px 64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <span style={pillStyle}>
              <span className="live-dot" style={dotStyle(data.votingOpen)} />
              {data.votingOpen ? "Voting open" : "Voting closed"}
            </span>
            {data.election.closesAt && (
              <span style={{ color: "#5C6B61", fontSize: 13 }}>
                Closes {fmt(data.election.closesAt)}
              </span>
            )}
          </div>
          <h1 className="font-serif" style={{ fontWeight: 600, fontSize: "clamp(28px,5vw,40px)", lineHeight: 1.1, margin: "0 0 14px", maxWidth: 680 }}>
            Elect the next executive council of your association
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "#46554C", maxWidth: 600, margin: "0 0 32px" }}>
            Your ballot is private and counts once. Have your matriculation number ready to begin — the process takes about two minutes.
          </p>

          <button
            onClick={() => {
              setMatricInput("");
              setLoginError("");
              go("login");
            }}
            disabled={!data.votingOpen}
            className="focus-ring"
            style={{
              background: data.votingOpen ? "#0E5A37" : "#9AA89D",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              padding: "15px 30px",
              fontSize: 15.5,
              fontWeight: 700,
              cursor: data.votingOpen ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 10px 26px rgba(14,90,55,.32)",
            }}
          >
            {data.votingOpen ? "Proceed to verification" : "Voting is closed"}
            <ArrowRight width={18} height={18} strokeWidth={2.4} />
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginTop: 46 }}>
            <Stat n={String(data.stats.positions)} label="Positions on the ballot" />
            <Stat n={String(data.stats.candidates)} label="Accredited candidates" />
            <Stat n={String(data.stats.eligible)} label="Eligible voters" />
            <Stat n="~2 min" label="Average time to vote" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 36 }}>
            <div style={cardStyle}>
              <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 600, margin: "0 0 16px" }}>How voting works</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Step n={1} text="Enter your matriculation number to confirm eligibility." />
                <Step n={2} text="Choose one candidate for each position, one page at a time." />
                <Step n={3} text="Review your choices and submit. You receive a sealed receipt." />
              </div>
            </div>
            <div style={{ ...cardStyle, background: "#0E5A37", color: "#E6F1EA", border: "none" }}>
              <h3 className="font-serif" style={{ fontSize: 19, fontWeight: 600, margin: "0 0 16px", color: "#fff" }}>Your vote is protected</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Protect icon={<Shield width={18} height={18} stroke="#C8932A" strokeWidth={2.2} />} bold="One vote per matric." text=" A second attempt is automatically flagged." />
                <Protect icon={<Lock width={18} height={18} stroke="#C8932A" strokeWidth={2.2} />} bold="Anonymous ballot." text=" Your identity is never linked to your selections." />
                <Protect icon={<Eye width={18} height={18} stroke="#C8932A" strokeWidth={2.2} />} bold="Independently observed." text=" Accredited observers monitor the live count." />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    );
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <GreenBackdrop>
        <Reveal style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={ringStyle}>
              <LeafMark size={30} />
            </div>
            <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 25, color: "#F4F1E6", margin: "0 0 6px" }}>
              Verify your eligibility
            </h1>
            <p style={{ fontSize: 13.5, color: "#9FBFAE", margin: 0 }}>
              Enter the matriculation number on your student record.
            </p>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
            <label htmlFor="matric" style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#3A483F", marginBottom: 8 }}>
              Matriculation number
            </label>
            <input
              id="matric"
              value={matricInput}
              onChange={(e) => {
                setMatricInput(e.target.value);
                setLoginError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submitLogin()}
              placeholder="e.g. PUB/22/014"
              autoFocus
              style={{
                width: "100%",
                padding: "14px 15px",
                border: "1.5px solid #D8D3C4",
                borderRadius: 10,
                fontSize: 16,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#0E5A37")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#D8D3C4")}
            />
            {loginError && (
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 12, background: "#FBEAEA", border: "1px solid #F0CFCF", color: "#A12B2B", padding: "11px 13px", borderRadius: 9, fontSize: 13, lineHeight: 1.45 }}>
                <AlertCircle width={16} height={16} strokeWidth={2.2} style={{ flex: "none", marginTop: 1 }} />
                <span>{loginError}</span>
              </div>
            )}
            <button
              onClick={submitLogin}
              disabled={verifying}
              className="focus-ring"
              style={{ width: "100%", marginTop: 18, background: "#0E5A37", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: verifying ? "wait" : "pointer", opacity: verifying ? 0.8 : 1 }}
            >
              {verifying ? "Verifying…" : "Verify & continue"}
            </button>
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px dashed #E0DBCC", fontSize: 12, color: "#7A887E", lineHeight: 1.6 }}>
              <strong style={{ color: "#46554C" }}>Demo numbers:</strong> PUB/22/014 · PUB/22/027 · PUB/23/102
              <br />
              <span style={{ color: "#B0651F" }}>PUB/22/001</span> has already voted — try it to see the duplicate-vote flag.
            </div>
          </div>
          <BackHome />
        </Reveal>
      </GreenBackdrop>
    );
  }

  // ── BALLOT ─────────────────────────────────────────────────────────────
  if (view === "ballot" && pos) {
    const sel = selections[pos.id];
    const progressPct = Math.round(((idx + 1) / positions.length) * 100);
    return (
      <div style={{ minHeight: "100vh", background: "#F2F0E6" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E4E0D4", padding: "16px 24px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, color: "#5C6B61" }}>
                Voting as <strong style={{ color: "#16241C" }}>{userName}</strong>
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0E5A37" }}>
                Position {idx + 1} of {positions.length}
              </span>
            </div>
            <div style={{ height: 7, background: "#E8E4D6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#0E5A37,#2DA05A)", borderRadius: 99, width: `${progressPct}%`, transition: "width .35s ease" }} />
            </div>
          </div>
        </div>

        <Reveal animationKey={idx} stagger={0.06} style={{ maxWidth: 860, margin: "0 auto", padding: "34px 24px 130px" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={eyebrowStyle}>Select one candidate</div>
            <h2 className="font-serif" style={{ fontWeight: 600, fontSize: "clamp(24px,5vw,32px)", margin: 0 }}>
              {pos.title}
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {pos.candidates.map((c) => {
              const selected = sel === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelections((s) => ({ ...s, [pos.id]: c.id }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelections((s) => ({ ...s, [pos.id]: c.id }))}
                  className="focus-ring"
                  style={{
                    background: "#fff",
                    border: `2px solid ${selected ? "#0E5A37" : "#E8E4D6"}`,
                    borderRadius: 15,
                    padding: 20,
                    cursor: "pointer",
                    position: "relative",
                    transition: "transform .16s ease, box-shadow .16s ease, border-color .16s ease",
                    boxShadow: selected ? "0 10px 26px rgba(14,90,55,.18)" : "0 2px 8px rgba(0,0,0,.04)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = "0 14px 30px rgba(0,0,0,.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = selected ? "0 10px 26px rgba(14,90,55,.18)" : "0 2px 8px rgba(0,0,0,.04)";
                  }}
                >
                  {selected && (
                    <div className="pop-in" style={{ position: "absolute", top: 13, right: 13, width: 26, height: 26, borderRadius: "50%", background: "#0E5A37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check width={15} height={15} stroke="#fff" strokeWidth={3} />
                    </div>
                  )}
                  <Avatar name={c.name} size={74} bg={c.avatarBg} photoUrl={c.photoUrl} fontSize={26} style={{ marginBottom: 14 }} />
                  <div className="font-serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2 }}>{c.name}</div>
                  <div style={{ fontSize: 12.5, color: "#6B7A6F", marginTop: 3 }}>{c.level}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModal({ ...c, positionTitle: pos.title, posId: pos.id });
                    }}
                    style={{ marginTop: 13, background: "transparent", border: "1px solid #D8D3C4", color: "#0E5A37", borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    View manifesto
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setSelections((s) => ({ ...s, [pos.id]: ABSTAIN }))}
            style={{ display: "block", margin: "22px auto 0", background: "transparent", border: "none", color: "#8A968C", fontSize: 13, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            I prefer to abstain for this position
          </button>
        </Reveal>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #E4E0D4", padding: "14px 24px", boxShadow: "0 -6px 20px rgba(0,0,0,.06)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => {
                if (idx > 0) {
                  setBallotIndex(idx - 1);
                  window.scrollTo(0, 0);
                } else go("landing");
              }}
              style={{ background: "#F2F0E6", border: "1px solid #E0DBCC", color: "#46554C", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              <ArrowLeft width={16} height={16} strokeWidth={2.4} />
              {idx === 0 ? "Back" : "Previous"}
            </button>
            <span style={{ fontSize: 12.5, color: "#8A968C" }}>
              {sel ? (sel === ABSTAIN ? "Abstained" : "Selection made") : "No selection yet"}
            </span>
            <button
              onClick={() => {
                if (idx < positions.length - 1) {
                  setBallotIndex(idx + 1);
                  window.scrollTo(0, 0);
                } else go("review");
              }}
              className="focus-ring"
              style={{ background: "#0E5A37", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              {idx === positions.length - 1 ? "Review ballot" : "Next position"}
              <ArrowRight width={16} height={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <ManifestoModal modal={modal} canSelect onClose={() => setModal(null)} onSelect={() => { if (modal) { setSelections((s) => ({ ...s, [modal.posId]: modal.id })); setModal(null); } }} />
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────
  if (view === "review") {
    return (
      <div style={{ minHeight: "100vh", background: "#F2F0E6", padding: "40px 22px 70px" }}>
        <Reveal style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={eyebrowStyle}>Final step</div>
            <h2 className="font-serif" style={{ fontWeight: 600, fontSize: 30, margin: "0 0 6px" }}>Review your ballot</h2>
            <p style={{ fontSize: 14, color: "#5C6B61", margin: 0 }}>
              Confirm your choices below. Once submitted, your ballot is sealed and cannot be changed.
            </p>
          </div>
          <div style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 15, overflow: "hidden" }}>
            {positions.map((p) => {
              const pick = selections[p.id];
              const cand = p.candidates.find((c) => c.id === pick);
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: "1px solid #EFEBDE" }}>
                  {cand ? (
                    <Avatar name={cand.name} size={44} bg={cand.avatarBg} photoUrl={cand.photoUrl} fontSize={16} />
                  ) : (
                    <div className="font-serif" style={{ width: 44, height: 44, borderRadius: "50%", background: "#9AA89D", color: "#fff", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      —
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, letterSpacing: ".06em", textTransform: "uppercase", color: "#8A968C", fontWeight: 700 }}>{p.title}</div>
                    <div className="font-serif" style={{ fontSize: 17, fontWeight: 600, color: cand ? "#16241C" : "#8A968C" }}>
                      {cand ? cand.name : "No selection (abstained)"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBallotIndex(positions.indexOf(p));
                      go("ballot");
                    }}
                    style={{ background: "transparent", border: "1px solid #D8D3C4", color: "#0E5A37", borderRadius: 8, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Change
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={submitBallot}
            disabled={submitting}
            className="focus-ring"
            style={{ width: "100%", marginTop: 20, background: "#0E5A37", color: "#fff", border: "none", borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 700, cursor: submitting ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 12px 28px rgba(14,90,55,.3)", opacity: submitting ? 0.85 : 1 }}
          >
            <ShieldCheck width={19} height={19} strokeWidth={2.2} />
            {submitting ? "Sealing your ballot…" : "Submit my sealed ballot"}
          </button>
          <button onClick={() => go("ballot")} style={linkBtnStyle}>Back to selection</button>
        </Reveal>
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <GreenBackdrop>
        <Reveal style={{ width: "100%", maxWidth: 440, textAlign: "center", color: "#F4F1E6" }}>
          <div className="pop-in" style={{ width: 92, height: 92, borderRadius: "50%", background: "rgba(45,160,90,.18)", border: "2px solid #2DA05A", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#7FE0A5" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" strokeDasharray={60} style={{ animation: "drawCheck .6s .25s ease both" }} />
            </svg>
          </div>
          <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 30, margin: "0 0 12px" }}>Your vote has been recorded</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#A9C4B5", margin: "0 0 26px" }}>
            Thank you, {userName}. Your ballot has been sealed and added to the count. This matriculation number can no longer vote.
          </p>
          <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 13, padding: 20 }}>
            <div style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "#8FB29E", marginBottom: 7 }}>
              Your verification receipt
            </div>
            <div className="font-serif" style={{ fontSize: 26, fontWeight: 600, letterSpacing: ".08em", color: "#fff" }}>{receipt}</div>
            <div style={{ fontSize: 12, color: "#8FB29E", marginTop: 7 }}>
              Keep this code. Observers can confirm your ballot was counted without revealing your choices.
            </div>
          </div>
          <Link href="/" className="focus-ring" style={{ display: "inline-block", marginTop: 26, background: "#C8932A", color: "#16241C", borderRadius: 10, padding: "13px 26px", fontSize: 14.5, fontWeight: 700, textDecoration: "none" }}>
            Return to home
          </Link>
        </Reveal>
      </GreenBackdrop>
    );
  }

  // ── FLAGGED ────────────────────────────────────────────────────────────
  if (view === "flagged") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 22px", background: "radial-gradient(120% 100% at 50% -10%, #5A2418 0%, #3D1812 60%, #2C110D 100%)" }}>
        <Reveal style={{ width: "100%", maxWidth: 440, textAlign: "center", color: "#F6E9E5" }}>
          <div className="pop-in" style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(214,108,80,.18)", border: "2px solid #D66C50", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
            <AlertTriangle width={44} height={44} stroke="#F0A78F" strokeWidth={2.2} />
          </div>
          <div style={{ fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase", color: "#E8927A", fontWeight: 700, marginBottom: 10 }}>
            Duplicate vote blocked
          </div>
          <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 28, margin: "0 0 12px" }}>This number has already voted</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "#D8B6AC", margin: "0 0 24px" }}>
            Matric <strong style={{ color: "#fff" }}>{flaggedMatric}</strong> cast a ballot at an earlier time. Each matriculation number is permitted exactly one vote, so this attempt has been recorded and flagged for review.
          </p>
          <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "16px 20px", textAlign: "left", fontSize: 13, lineHeight: 1.6, color: "#D8B6AC" }}>
            If you believe this is an error, contact the electoral committee at the Department of Public Administration with your student ID. This incident reference: <strong style={{ color: "#fff" }}>{flagRef}</strong>
          </div>
          <Link href="/" className="focus-ring" style={{ display: "inline-block", marginTop: 24, background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Return to home
          </Link>
        </Reveal>
      </div>
    );
  }

  return null;
}

// ── Shared presentational bits ─────────────────────────────────────────────

const pillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: "#E2F0E7",
  color: "#0E5A37",
  padding: "6px 12px",
  borderRadius: 999,
  fontSize: 12.5,
  fontWeight: 700,
  letterSpacing: ".03em",
};
const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "#C8932A",
  fontWeight: 700,
  marginBottom: 8,
};
const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E4E0D4",
  borderRadius: 15,
  padding: 26,
};
const ringStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#0A3D26",
  border: "1.5px solid #C8932A",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 14,
};
const linkBtnStyle: React.CSSProperties = {
  display: "block",
  margin: "14px auto 0",
  background: "transparent",
  border: "none",
  color: "#8A968C",
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};
function dotStyle(open: boolean): React.CSSProperties {
  return { width: 8, height: 8, borderRadius: "50%", background: open ? "#2DA05A" : "#9AA89D", display: "inline-block" };
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ECEAE0", textAlign: "center" }}>
      {children}
    </div>
  );
}

function GreenBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 22px", background: "radial-gradient(120% 100% at 50% -20%, #114D33 0%, #0A3D26 60%, #082E1D 100%)" }}>
      {children}
    </div>
  );
}

function BrandHeader({ institution, subtitle }: { institution: string; subtitle: string }) {
  return (
    <div style={{ background: "#0A3D26", color: "#F4F1E6", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#0E5A37", border: "1.5px solid #C8932A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <LeafMark size={24} />
      </div>
      <div style={{ lineHeight: 1.3 }}>
        <div className="font-serif" style={{ fontSize: 16, fontWeight: 600 }}>{institution}</div>
        <div style={{ fontSize: 12, color: "#9FBFAE" }}>{subtitle}</div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div style={cardStyle}>
      <div className="font-serif" style={{ fontSize: 30, fontWeight: 600, color: "#0E5A37" }}>{n}</div>
      <div style={{ fontSize: 12.5, color: "#5C6B61", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#E2F0E7", color: "#0E5A37", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{n}</span>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: "#46554C" }}>{text}</div>
    </div>
  );
}

function Protect({ icon, bold, text }: { icon: React.ReactNode; bold: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
      <span style={{ flex: "none", marginTop: 1 }}>{icon}</span>
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        <strong style={{ color: "#fff" }}>{bold}</strong>
        {text}
      </div>
    </div>
  );
}

function BackHome() {
  return (
    <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 18, color: "#9FBFAE", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 3 }}>
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
  if (!modal) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,30,20,.55)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} className="pop-in" style={{ background: "#fff", borderRadius: 18, maxWidth: 460, width: "100%", overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.4)" }}>
        <div style={{ background: modal.avatarBg, padding: 28, display: "flex", alignItems: "center", gap: 16, color: "#fff" }}>
          <Avatar
            name={modal.name}
            size={72}
            bg="rgba(255,255,255,.2)"
            photoUrl={modal.photoUrl}
            fontSize={26}
            style={{ border: "2px solid rgba(255,255,255,.5)" }}
          />
          <div>
            <div style={{ fontSize: 11.5, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.85, fontWeight: 700 }}>{modal.positionTitle}</div>
            <div className="font-serif" style={{ fontSize: 23, fontWeight: 600, marginTop: 2 }}>{modal.name}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>{modal.level}</div>
          </div>
        </div>
        <div style={{ padding: "24px 28px 28px" }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: "#8A968C", fontWeight: 700, marginBottom: 8 }}>Manifesto</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: "#3A483F", margin: "0 0 18px" }}>{modal.manifesto}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: "#F2F0E6", border: "1px solid #E0DBCC", color: "#46554C", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
            {canSelect && (
              <button onClick={onSelect} style={{ flex: 1, background: "#0E5A37", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Select this candidate</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
