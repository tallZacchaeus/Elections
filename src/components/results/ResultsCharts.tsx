"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

interface LevelStat {
  level: string;
  eligible: number;
  voted: number;
  turnoutPct: number;
}
interface TimelinePoint {
  label: string;
  count: number;
  cumulative: number;
}

const GREEN = "#0e5a37";
const GOLD = "#c8932a";
const MUTED = "#cfc8b4";
const TEAL = "#1f6e5e";

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-3 p-5">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64 w-full">{children}</div>
    </Card>
  );
}

export function ResultsCharts({
  votesCast,
  totalEligible,
  levels,
  timeline,
}: {
  votesCast: number;
  totalEligible: number;
  levels: LevelStat[];
  timeline: TimelinePoint[];
}) {
  const notVoted = Math.max(0, totalEligible - votesCast);
  const turnoutData = [
    { name: "Voted", value: votesCast },
    { name: "Not voted", value: notVoted },
  ];
  const turnoutPct = totalEligible > 0 ? Math.round((votesCast / totalEligible) * 100) : 0;

  const levelData = levels.map((l) => ({
    level: l.level,
    Eligible: l.eligible,
    Voted: l.voted,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Turnout donut */}
        <ChartCard title="Turnout" subtitle={`${votesCast} of ${totalEligible} eligible voters (${turnoutPct}%)`}>
          {totalEligible > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={turnoutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  <Cell fill={GREEN} />
                  <Cell fill={MUTED} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </ChartCard>

        {/* ND / HND grouped bar */}
        <ChartCard title="Voters by level (ND / HND)" subtitle="Eligible vs voted per programme level">
          {levelData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e0d4" />
                <XAxis dataKey="level" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Eligible" fill={MUTED} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Voted" fill={GREEN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty />
          )}
        </ChartCard>
      </div>

      {/* Ballots over time */}
      <ChartCard title="Ballots cast over time" subtitle="Cumulative sealed ballots, by hour">
        {timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ left: -10, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="ballotFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e0d4" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="cumulative"
                name="Ballots"
                stroke={GREEN}
                strokeWidth={2}
                fill="url(#ballotFill)"
                dot={{ r: 2, fill: GOLD }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty label="No ballots cast yet — this chart fills in as voting happens." />
        )}
      </ChartCard>
    </div>
  );
}

function Empty({ label = "No data to chart yet." }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
