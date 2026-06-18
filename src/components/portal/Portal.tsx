"use client";

import Link from "next/link";
import { LogoBadge } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { BallotCheck, Star, Eye } from "@/components/Icons";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "#F4F1E6",
        background:
          "radial-gradient(120% 90% at 80% -10%, #0E5A37 0%, #093821 55%, #06281A 100%)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "56px 24px",
          textAlign: "center",
        }}
      >
        <Reveal stagger={0.09} y={18} style={{ width: "100%", maxWidth: 800 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <LogoBadge size={84} />
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: ".32em",
              textTransform: "uppercase",
              color: "#C8932A",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            Secure Electronic Ballot
          </div>
          <h1
            className="font-serif"
            style={{
              fontWeight: 600,
              fontSize: "clamp(30px, 6vw, 46px)",
              lineHeight: 1.08,
              margin: "0 auto 14px",
              maxWidth: 760,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#BBD3C4",
              maxWidth: 560,
              margin: "0 auto 4px",
            }}
          >
            {faculty} · {department}
          </p>
          <p style={{ fontSize: 14, color: "#8FB29E", maxWidth: 540, margin: "0 auto 40px" }}>
            {institution}
          </p>
        </Reveal>

        <Reveal
          stagger={0.1}
          delay={0.15}
          y={22}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 240px))",
            gap: 18,
            width: "100%",
            maxWidth: 780,
            justifyContent: "center",
          }}
        >
          <RoleCard
            href="/vote"
            featured
            iconBg="#0E5A37"
            icon={<BallotCheck width={20} height={20} stroke="#fff" />}
            title="Cast your vote"
            desc="Verify your matriculation number and select your candidates."
          />
          <RoleCard
            href="/admin/login"
            iconBg="#C8932A"
            icon={<Star width={20} height={20} stroke="#16241C" />}
            title="Administrator"
            desc="Configure elections, candidates and the voter roster."
          />
          <RoleCard
            href="/observer/login"
            iconBg="rgba(255,255,255,.16)"
            icon={<Eye width={20} height={20} stroke="#F4F1E6" />}
            title="Observer"
            desc="Monitor live results and export official reports."
          />
        </Reveal>
      </div>

      <div
        style={{
          display: "flex",
          gap: 26,
          justifyContent: "center",
          flexWrap: "wrap",
          padding: 20,
          borderTop: "1px solid rgba(255,255,255,.1)",
          color: "#8FB29E",
          fontSize: 12.5,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            className="live-dot"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: votingOpen ? "#3CB371" : "#9AA89D",
              display: "inline-block",
            }}
          />
          {votingOpen ? "Voting is open" : "Voting is closed"}
        </span>
        <span>One vote per matric number</span>
        <span>Independently observed</span>
      </div>
    </div>
  );
}

function RoleCard({
  href,
  icon,
  iconBg,
  title,
  desc,
  featured = false,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  desc: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className="focus-ring"
      style={{
        textDecoration: "none",
        background: featured ? "#F4F1E6" : "rgba(255,255,255,.07)",
        border: featured ? "none" : "1px solid rgba(255,255,255,.18)",
        borderRadius: 14,
        padding: "24px 22px",
        textAlign: "left",
        boxShadow: featured ? "0 8px 24px rgba(0,0,0,.22)" : "none",
        transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",
        display: "block",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = featured
          ? "0 16px 36px rgba(0,0,0,.3)"
          : "0 12px 28px rgba(0,0,0,.2)";
        if (!featured) e.currentTarget.style.background = "rgba(255,255,255,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = featured
          ? "0 8px 24px rgba(0,0,0,.22)"
          : "none";
        if (!featured) e.currentTarget.style.background = "rgba(255,255,255,.07)";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <div
        className="font-serif"
        style={{
          fontSize: 21,
          fontWeight: 600,
          color: featured ? "#16241C" : "#F4F1E6",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.5,
          color: featured ? "#5C6B61" : "#A9C4B5",
        }}
      >
        {desc}
      </div>
    </Link>
  );
}
