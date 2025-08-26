import { NextRequest } from "next/server";
import { createAwsClients } from "@/lib/aws";
import { GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { startOfDay, subDays, formatISO } from "date-fns";
import { CostKpis } from "@/types/api";

export async function GET(req: NextRequest) {
  try {
    const { costExplorer } = createAwsClients();

    // Check for 30-day preview parameter
    const { searchParams } = new URL(req.url);
    const preview30d = searchParams.get("preview30d") === "true";
    const days = preview30d ? 30 : 7;

    const end = startOfDay(new Date());
    const start = subDays(end, days);

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
        return {
          date: d.TimePeriod?.Start || "",
          costUsd: Math.round(amount * 100) / 100,
        };
      }
    );

    const totalCostUsd = daily.reduce(
      (s: number, d: { costUsd: number }) => s + d.costUsd,
      0
    );
    const dailyBurnUsd = daily.at(-1)?.costUsd || 0;
    const avgDailyCost = totalCostUsd / Math.max(1, daily.length);
    const projectedMonthlyUsd = Math.round(dailyBurnUsd * 30 * 100) / 100;

    // Return full series for requested period
    const series7d = daily;

    // Calculate anomaly based on recent trend vs average
    const anomaly =
      dailyBurnUsd > avgDailyCost * 1.3
        ? {
            present: true,
            message: `Daily cost ${Math.round(
              (dailyBurnUsd / avgDailyCost - 1) * 100
            )}% above ${days}-day average`,
          }
        : { present: false };

    // Calculate efficiency metrics
    // Note: These are estimates based on cost patterns - in production you'd integrate with
    // CloudWatch metrics, AWS Compute Optimizer, or AWS Cost Optimization Hub
    const calculateEfficiencyMetrics = () => {
      // Estimate waste based on cost variance (higher variance often indicates inefficiency)
      const costVariance =
        daily.reduce((sum, day) => {
          return sum + Math.pow(day.costUsd - avgDailyCost, 2);
        }, 0) / daily.length;

      const normalizedVariance = Math.min(
        costVariance / (avgDailyCost * avgDailyCost),
        1
      );
      const wasteEstimatePercent = 0.15 + normalizedVariance * 0.25; // 15-40% range

      // Utilization score based on cost consistency (more consistent = better utilization)
      const utilizationScore = Math.max(
        20,
        Math.min(100, 100 - normalizedVariance * 100)
      );

      // Savings opportunity based on waste estimate
      const savingsOpportunityPercent = wasteEstimatePercent * 0.8; // 80% of waste is recoverable

      return {
        wasteEstimateUsd:
          Math.round(totalCostUsd * wasteEstimatePercent * 100) / 100,
        utilizationScore: Math.round(utilizationScore),
        savingsOpportunityUsd:
          Math.round(projectedMonthlyUsd * savingsOpportunityPercent * 100) /
          100,
      };
    };

    const payload: CostKpis = {
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      dailyBurnUsd,
      projectedMonthlyUsd,
      lastUpdated: new Date().toISOString(),
      anomaly,
      series7d,
      efficiency: calculateEfficiencyMetrics(),
    };

    return Response.json(payload);
  } catch (error: unknown) {
    console.error("Cost KPIs API error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.name : "Unknown error",
        message:
          error instanceof Error ? error.message : "Failed to fetch cost KPIs",
        details:
          error instanceof Error && error.name === "AccessDeniedException"
            ? "Missing Cost Explorer permissions. See README for required IAM policy."
            : undefined,
      },
      { status: 500 }
    );
  }
}
