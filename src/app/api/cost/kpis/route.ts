import { NextRequest } from "next/server";
import { createAwsClients } from "@/lib/aws";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { startOfDay, subDays, formatISO } from "date-fns";
import { CostKpis } from "@/types/api";

export async function GET(_req: NextRequest) {
  try {
    const { costExplorer } = createAwsClients();
    const end = startOfDay(new Date());
    const start = subDays(end, 7);

    const res = await costExplorer.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatISO(start, { representation: "date" }),
          End: formatISO(end, { representation: "date" }),
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      })
    );

    const daily = (res.ResultsByTime || []).map(
      (d: {
        TimePeriod?: { Start?: string };
        Total?: { UnblendedCost?: { Amount?: string } };
      }) => {
        const amount = parseFloat(d.Total?.UnblendedCost?.Amount || "0");
        return { date: d.TimePeriod?.Start || "", costUsd: amount };
      }
    );
    const totalCostUsd = daily.reduce(
      (s: number, d: { costUsd: number }) => s + d.costUsd,
      0
    );
    const dailyBurnUsd = daily.at(-1)?.costUsd || 0;
    const projectedMonthlyUsd = dailyBurnUsd * 30;

    const series7d = daily;
    const anomaly =
      dailyBurnUsd > (totalCostUsd / Math.max(1, daily.length)) * 1.5
        ? { present: true, message: "Daily burn > 150% of 7d avg" }
        : { present: false };

    const payload: CostKpis = {
      totalCostUsd,
      dailyBurnUsd,
      projectedMonthlyUsd,
      lastUpdated: new Date().toISOString(),
      anomaly,
      series7d,
    };

    return Response.json(payload);
  } catch (error: any) {
    console.error("Cost KPIs API error:", error);
    return Response.json(
      {
        error: error.name || "Unknown error",
        message: error.message || "Failed to fetch cost KPIs",
        details:
          error.name === "AccessDeniedException"
            ? "Missing Cost Explorer permissions. See README for required IAM policy."
            : undefined,
      },
      { status: 500 }
    );
  }
}
