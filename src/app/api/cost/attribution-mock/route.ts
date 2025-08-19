import { NextRequest } from "next/server";
import { CostAttribution } from "@/types/api";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dim = sp.get("dimension") || "REGION";

  // Mock data for testing without Cost Explorer
  const mockData: CostAttribution = {
    dimension: dim,
    timeRange: { start: "2024-01-15", end: "2024-01-22" },
    totalCostUsd: 1247.83,
    buckets: [
      { key: "us-east-1", totalCostUsd: 687.45 },
      { key: "us-west-2", totalCostUsd: 324.18 },
      { key: "eu-west-1", totalCostUsd: 156.23 },
      { key: "ap-southeast-1", totalCostUsd: 67.89 },
      { key: "ca-central-1", totalCostUsd: 12.08 },
    ],
    unaccountedUsd: 0,
  };

  return Response.json(mockData);
}
