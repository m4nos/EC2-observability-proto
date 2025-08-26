import { NextRequest } from "next/server";
import { CostKpis } from "@/types/api";

export async function GET(req: NextRequest) {
  // Mock data for testing without Cost Explorer
  const { searchParams } = new URL(req.url);
  const preview30d = searchParams.get("preview30d") === "true";
  const days = preview30d ? 30 : 7;

  const today = new Date();
  const generateDateSeries = (daysCount: number) => {
    const series = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      series.push(date.toISOString().split("T")[0]);
    }
    return series;
  };

  const dates = generateDateSeries(days);
  const baselineCost = 38;
  const fullSeries = dates.map((date, index) => {
    let costUsd = baselineCost;
    // Add some realistic variation with seasonal patterns for 30-day view
    if (preview30d) {
      const weekdayIndex = new Date(date).getDay();
      // Weekend reduction (Sat=6, Sun=0)
      if (weekdayIndex === 0 || weekdayIndex === 6) {
        costUsd *= 0.7; // 30% reduction on weekends
      }
      // Add weekly patterns
      costUsd += Math.sin((index / 7) * Math.PI) * 5; // Weekly sine wave
    }

    // Add daily variation
    costUsd += Math.random() * 8 - 4; // ±4 variation

    // Create a spike on the most recent day
    if (index === dates.length - 1) {
      costUsd = 58.75;
    }

    return { date, costUsd: Math.round(costUsd * 100) / 100 };
  });

  // Return appropriate series based on preview mode
  const seriesData = fullSeries;
  const totalCostUsd = fullSeries.reduce((sum, day) => sum + day.costUsd, 0);
  const dailyBurnUsd = fullSeries[fullSeries.length - 1].costUsd;
  const avgDailyCost = totalCostUsd / fullSeries.length;
  const projectedMonthlyUsd = Math.round(dailyBurnUsd * 30 * 100) / 100;

  const mockData: CostKpis = {
    totalCostUsd: Math.round(totalCostUsd * 100) / 100,
    dailyBurnUsd,
    projectedMonthlyUsd,
    lastUpdated: new Date().toISOString(),
    anomaly:
      dailyBurnUsd > avgDailyCost * 1.3
        ? {
            present: true,
            message: `Daily cost ${Math.round(
              (dailyBurnUsd / avgDailyCost - 1) * 100
            )}% above ${days}-day average`,
          }
        : { present: false },
    series7d: seriesData,
    efficiency: {
      wasteEstimateUsd:
        Math.round(totalCostUsd * (preview30d ? 0.19 : 0.23) * 100) / 100, // Lower waste for longer periods
      utilizationScore: preview30d ? 74 : 67, // Better utilization score for 30-day view
      savingsOpportunityUsd:
        Math.round(projectedMonthlyUsd * (preview30d ? 0.25 : 0.31) * 100) /
        100, // Adjusted savings
    },
  };

  return Response.json(mockData);
}
