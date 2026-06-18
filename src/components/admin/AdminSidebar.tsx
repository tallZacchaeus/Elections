"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LeafMark } from "@/components/Logo";
import { LogOut } from "@/components/Icons";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/roster", label: "Voter roster" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ name, title }: { name: string; title: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className="no-print"
      style={{
        width: 228,
        flex: "none",
        background: "#0A3D26",
        color: "#CFE0D6",
        padding: "22px 14px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 18px", borderBottom: "1px solid rgba(255,255,255,.1)", marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0E5A37", border: "1px solid #C8932A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <LeafMark size={18} />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Admin Console</div>
          <div style={{ fontSize: 10.5, color: "#8FB29E" }}>{title}</div>
        </div>
      </div>

      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="focus-ring"
            style={{
              textAlign: "left",
              borderRadius: 9,
              padding: "10px 13px",
              fontSize: 13.5,
              fontWeight: 600,
              marginBottom: 3,
              textDecoration: "none",
              transition: "background .15s ease",
              background: active ? "#0E5A37" : "transparent",
              color: active ? "#fff" : "#A9C4B5",
            }}
          >
            {item.label}
          </Link>
        );
      })}

      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div style={{ padding: "0 10px 12px", fontSize: 11, color: "#6F9682", lineHeight: 1.5 }}>
          Signed in as
          <br />
          <strong style={{ color: "#CFE0D6" }}>{name}</strong>
        </div>
        <button
          onClick={logout}
          style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "#CFE0D6", borderRadius: 9, padding: "9px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          <LogOut width={15} height={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
