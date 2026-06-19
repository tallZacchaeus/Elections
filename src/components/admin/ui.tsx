import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card className="gap-0 p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-foreground">{value}</div>
    </Card>
  );
}

export function LivePill({ open }: { open: boolean }) {
  return (
    <Badge
      variant={open ? "default" : "secondary"}
      className="gap-2 px-3.5 py-1.5 text-[13px] font-semibold"
    >
      <span
        className={cn(
          "size-2 rounded-full",
          open ? "bg-primary-foreground" : "bg-muted-foreground",
        )}
      />
      {open ? "Voting open" : "Voting closed"}
    </Badge>
  );
}
