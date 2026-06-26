import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = LABELS[status] ?? status;
  const open = status === "OPEN";
  return (
    <Badge
      variant={open ? "default" : status === "DRAFT" ? "outline" : "secondary"}
      className={cn("gap-1.5", className)}
    >
      {open && <span className="live-dot inline-block size-1.5 rounded-full bg-primary-foreground" />}
      {label}
    </Badge>
  );
}
