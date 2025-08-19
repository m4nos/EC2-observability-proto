"use client";
import useSWR from "swr";
import { CostAttribution } from "@/types/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COLORS = [
  "#60a5fa",
  "#f472b6",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#22d3ee",
  "#c084fc",
];

export default function CostAttributionPanel() {
  // Use mock data until Cost Explorer is enabled (24h delay)
  const { data } = useSWR<CostAttribution>(
    "/api/cost/attribution-mock?dimension=REGION&days=7",
    fetcher,
    { refreshInterval: 60_000 }
  );
  const buckets = data?.buckets?.slice(0, 8) || [];
  const total = data?.totalCostUsd || 0;
  const unaccounted = data?.unaccountedUsd || 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div
        style={{ height: 220, background: "#111", borderRadius: 8, padding: 8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={buckets}
              dataKey="totalCostUsd"
              nameKey="key"
              innerRadius={50}
              outerRadius={80}
            >
              {buckets.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: string | number) => formatUsd(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ background: "#111", borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          Breakdown by {data?.dimension}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 6, borderBottom: "1px solid #222" }}>
                Key
              </th>
              <th style={{ padding: 6, borderBottom: "1px solid #222" }}>
                Cost
              </th>
              <th style={{ padding: 6, borderBottom: "1px solid #222" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.key}>
                <td style={{ padding: 6 }}>{b.key}</td>
                <td style={{ padding: 6 }}>{formatUsd(b.totalCostUsd)}</td>
                <td style={{ padding: 6 }}>
                  {((b.totalCostUsd / Math.max(1, total)) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {unaccounted > 0 && (
              <tr>
                <td style={{ padding: 6, opacity: 0.8 }}>Unaccounted</td>
                <td style={{ padding: 6 }}>{formatUsd(unaccounted)}</td>
                <td style={{ padding: 6 }}>
                  {((unaccounted / Math.max(1, total)) * 100).toFixed(1)}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
