import { NextRequest } from "next/server";
import { createAwsClients } from "@/lib/aws";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { formatISO, subDays, startOfDay } from "date-fns";
import { CostAttribution, DimensionType } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const { costExplorer } = createAwsClients();
    const sp = req.nextUrl.searchParams;
    const dim = (sp.get("dimension") || "REGION") as DimensionType;
    const days = parseInt(sp.get("days") || "7", 10);
    const end = startOfDay(new Date());
    const start = subDays(end, days);

    // For research team dimensions (TEAM, PROJECT, RESEARCHER, JOB_TYPE),
    // we need to map to AWS tags or use instance metadata
    const isCustomDimension = [
      "TEAM",
      "PROJECT",
      "RESEARCHER",
      "JOB_TYPE",
    ].includes(dim);

    if (isCustomDimension) {
      // Fallback to mock data for custom dimensions until tag-based grouping is implemented
      const response = await fetch(
        `${req.nextUrl.origin}/api/cost/attribution-mock?${sp.toString()}`
      );
      return Response.json(await response.json());
    }

    const res = await costExplorer.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatISO(start, { representation: "date" }),
          End: formatISO(end, { representation: "date" }),
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        GroupBy: [
          {
            Type: "DIMENSION",
            Key: dim as unknown as
              | "REGION"
              | "INSTANCE_TYPE"
              | "LINKED_ACCOUNT"
              | "AZ"
              | "USAGE_TYPE"
              | "SERVICE",
          },
        ],
      })
    );

    const groups = res.ResultsByTime || [];
    const totals: Record<string, number> = {};
    let totalCost = 0;
    for (const g of groups) {
      const timeTotal = parseFloat(g.Total?.UnblendedCost?.Amount || "0");
      totalCost += timeTotal;
      for (const grp of g.Groups || []) {
        const key = grp.Keys?.[0] || "UNKNOWN";
        const amount = parseFloat(grp.Metrics?.UnblendedCost?.Amount || "0");
        totals[key] = (totals[key] || 0) + amount;
      }
    }

    const buckets = Object.entries(totals)
      .map(([key, val]) => ({ key, totalCostUsd: val }))
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd);

    const accounted = buckets.reduce((s, b) => s + b.totalCostUsd, 0);
    const unaccountedUsd = Math.max(0, totalCost - accounted);

    const payload: CostAttribution = {
      dimension: dim,
      timeRange: {
        start: formatISO(start, { representation: "date" }),
        end: formatISO(end, { representation: "date" }),
      },
      totalCostUsd: totalCost,
      attributedCostUsd: accounted,
      buckets,
      unaccountedUsd,
    };

    return Response.json(payload);
  } catch (error: unknown) {
    console.error("Cost attribution API error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.name : "Unknown error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch cost attribution data",
        details:
          error instanceof Error && error.name === "AccessDeniedException"
            ? "Missing Cost Explorer permissions. See README for required IAM policy."
            : undefined,
      },
      { status: 500 }
    );
  }
}
