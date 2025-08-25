"use client";
import useSWR from "swr";
import { InstanceRow } from "@/types/api";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ApiResponse = { instances: InstanceRow[] };

export default function InstanceTable() {
  const { data } = useSWR<ApiResponse>("/api/ec2/instances-mock", fetcher, {
    refreshInterval: 60_000,
  });
  const rows = data?.instances || [];

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Filter by region"
          style={{
            padding: 8,
            borderRadius: 6,
            background: "#111",
            border: "1px solid #222",
          }}
        />
        <input
          placeholder="Filter by type"
          style={{
            padding: 8,
            borderRadius: 6,
            background: "#111",
            border: "1px solid #222",
          }}
        />
      </div>
      <div
        style={{ overflow: "auto", border: "1px solid #222", borderRadius: 8 }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#0f0f0f" }}>
              {[
                "Instance",
                "Region",
                "Type",
                "State",
                "CPU avg (24h)",
                "CPU max (24h)",
                "$/hr",
                "Waste",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 8,
                    borderBottom: "1px solid #222",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.instanceId}
                style={{ borderBottom: "1px solid #1a1a1a" }}
              >
                <td style={{ padding: 8 }}>
                  <div style={{ fontWeight: 600 }}>
                    {r.name || r.instanceId}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {r.instanceId}
                  </div>
                </td>
                <td style={{ padding: 8 }}>{r.region}</td>
                <td style={{ padding: 8 }}>{r.instanceType}</td>
                <td style={{ padding: 8 }}>{r.state}</td>
                <td style={{ padding: 8 }}>
                  {formatPct(r.cpuUtilizationAvg24h)}
                </td>
                <td style={{ padding: 8 }}>
                  {formatPct(r.cpuUtilizationMax24h)}
                </td>
                <td style={{ padding: 8 }}>
                  {r.costPerHourUsd == null
                    ? "—"
                    : `$${r.costPerHourUsd.toFixed(3)}`}
                </td>
                <td style={{ padding: 8 }}>
                  <WastePills indicators={r.wasteIndicators} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WastePills({
  indicators,
}: {
  indicators: InstanceRow["wasteIndicators"];
}) {
  if (!indicators || indicators.length === 0)
    return <span style={{ opacity: 0.5 }}>None</span>;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {indicators.map((i, idx) => (
        <span
          key={idx}
          style={{
            fontSize: 12,
            padding: "2px 6px",
            borderRadius: 999,
            background:
              i.severity === "high"
                ? "#7f1d1d"
                : i.severity === "medium"
                ? "#78350f"
                : "#1f2937",
            border: "1px solid #222",
          }}
        >
          {i.reason}
        </span>
      ))}
    </div>
  );
}

function formatPct(n?: number | null) {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
}
