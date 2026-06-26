import { ResultReportDocument } from "@/components/results/ResultReportDocument";

export const dynamic = "force-dynamic";

export default function AdminResultReportPage() {
  return <ResultReportDocument backHref="/admin" />;
}
