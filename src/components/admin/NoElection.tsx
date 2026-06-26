import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

/** Shown on admin sub-pages when there is no election to manage yet. */
export function NoElection() {
  return (
    <Card className="max-w-lg items-center gap-2 p-10 text-center">
      <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CalendarPlus className="size-6" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">No election yet</h2>
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Create an election to start adding positions, candidates and a voter roster.
      </p>
      <Button asChild>
        <Link href="/admin/elections">Go to Elections</Link>
      </Button>
    </Card>
  );
}
