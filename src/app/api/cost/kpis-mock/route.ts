import { NextRequest } from "next/server";
import { CostKpis } from "@/types/api";

export async function GET(_req: NextRequest) {
  // Mock data for testing without Cost Explorer
  const mockData: CostKpis = {
    totalCostUsd: 1247.83,
    dailyBurnUsd: 42.15,
    projectedMonthlyUsd: 1264.5,
    lastUpdated: new Date().toISOString(),
    anomaly: { present: true, message: "Daily burn > 150% of 7d avg" },
    series7d: [
      { date: "2024-01-15", costUsd: 38.24 },
      { date: "2024-01-16", costUsd: 41.67 },
      { date: "2024-01-17", costUsd: 39.82 },
      { date: "2024-01-18", costUsd: 44.91 },
      { date: "2024-01-19", costUsd: 37.15 },
      { date: "2024-01-20", costUsd: 43.89 },
      { date: "2024-01-21", costUsd: 52.15 }, // spike
    ],
  };

  return Response.json(mockData);
}
