import type { CSSProperties, ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, gap: 14, flexWrap: "wrap" }}>
      <div>
        <h1 className="font-serif" style={{ fontWeight: 600, fontSize: 27, margin: "0 0 4px" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13.5, color: "#5C6B61", margin: 0 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #E4E0D4",
  borderRadius: 14,
  padding: 22,
};

export function StatCard({
  label,
  value,
  color = "#16241C",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E0D4", borderRadius: 13, padding: 18 }}>
      <div style={{ fontSize: 12, color: "#5C6B61" }}>{label}</div>
      <div className="font-serif" style={{ fontSize: 30, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function LivePill({ open }: { open: boolean }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, background: open ? "#E2F0E7" : "#F2EFE4", color: open ? "#0E5A37" : "#8A968C", padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
      <span className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: open ? "#2DA05A" : "#9AA89D" }} />
      {open ? "Voting open" : "Voting closed"}
    </span>
  );
}

export function btnPrimary(extra?: CSSProperties): CSSProperties {
  return { background: "#0E5A37", color: "#fff", border: "none", borderRadius: 9, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", ...extra };
}
export function btnGhost(extra?: CSSProperties): CSSProperties {
  return { background: "#fff", border: "1px solid #D8D3C4", color: "#46554C", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", ...extra };
}
export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  border: "1.5px solid #D8D3C4",
  borderRadius: 9,
  fontSize: 14,
  outline: "none",
  background: "#fff",
};
export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#46554C",
  marginBottom: 6,
};
