"use client";
import useSWR from "swr";
import { CostKpis } from "@/types/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KPIs() {
  // Use mock data until Cost Explorer is enabled (24h delay)
  const { data } = useSWR<CostKpis>("/api/cost/kpis-mock", fetcher, {
    refreshInterval: 60_000,
  });
  const k = data;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <KpiCard title="Total (7d)" value={formatUsd(k?.totalCostUsd)} />
        <KpiCard
          title="Daily burn"
          value={formatUsd(k?.dailyBurnUsd)}
          highlight={k?.anomaly?.present}
        />
        <KpiCard
          title="Projected month"
          value={formatUsd(k?.projectedMonthlyUsd)}
        />
      </div>
      <div
        style={{ height: 140, background: "#111", borderRadius: 8, padding: 8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={k?.series7d || []}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: string | number) => formatUsd(Number(v))} />
            <Line
              type="monotone"
              dataKey="costUsd"
              stroke="#7dd3fc"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "#3b82f6" : "#111",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value ?? "—"}</div>
      {highlight && <div style={{ fontSize: 12 }}>Spike detected</div>}
    </div>
  );
}

function formatUsd(n?: number) {
  if (n == null) return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
