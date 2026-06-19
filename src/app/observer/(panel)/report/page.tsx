import { ResultReportDocument } from "@/components/results/ResultReportDocument";

export const dynamic = "force-dynamic";

export default function ObserverResultReportPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-[900px]">
        <ResultReportDocument backHref="/observer" />
      </div>
    </div>
  );
}
