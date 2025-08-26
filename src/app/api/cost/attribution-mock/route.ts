import { NextRequest } from "next/server";
import { CostAttribution, DimensionType } from "@/types/api";
import { subDays, formatISO, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dim = (sp.get("dimension") || "TEAM") as DimensionType;
  const days = parseInt(sp.get("days") || "7", 10);
  const end = startOfDay(new Date());
  const start = subDays(end, days);
  const includeComparison = sp.get("compare") === "true";

  // Research-focused mock data generators
  const generateMockData = (dimension: DimensionType): CostAttribution => {
    const baseData = getMockDataByDimension(dimension);
    const totalCostUsd = baseData.buckets.reduce(
      (sum, b) => sum + b.totalCostUsd,
      0
    );
    const attributedCostUsd = totalCostUsd * 0.92; // 8% unaccounted
    const unaccountedUsd = totalCostUsd - attributedCostUsd;

    return {
      dimension,
      timeRange: {
        start: formatISO(start, { representation: "date" }),
        end: formatISO(end, { representation: "date" }),
      },
      totalCostUsd,
      attributedCostUsd,
      buckets: baseData.buckets,
      unaccountedUsd,
      anomalies: baseData.anomalies,
      comparison: includeComparison
        ? {
            percentChange:
              Math.random() > 0.5
                ? +(12 + Math.random() * 25).toFixed(1) // Increase
                : -(5 + Math.random() * 15).toFixed(1), // Decrease
          }
        : undefined,
    };
  };

  return Response.json(generateMockData(dim));
}

function getMockDataByDimension(dimension: DimensionType) {
  switch (dimension) {
    case "TEAM":
      return {
        buckets: [
          {
            key: "ML-Research",
            totalCostUsd: 1847.32,
            instanceCount: 23,
            cpuHours: 4320,
            trend: "increasing" as const,
            metadata: { priority: "high" as const },
          },
          {
            key: "Genomics",
            totalCostUsd: 1253.67,
            instanceCount: 15,
            cpuHours: 2880,
            trend: "stable" as const,
            metadata: { priority: "high" as const },
          },
          {
            key: "Climate-Modeling",
            totalCostUsd: 892.45,
            instanceCount: 12,
            cpuHours: 2160,
            trend: "decreasing" as const,
            metadata: { priority: "medium" as const },
          },
          {
            key: "Astrophysics",
            totalCostUsd: 634.78,
            instanceCount: 8,
            cpuHours: 1440,
            trend: "stable" as const,
            metadata: { priority: "medium" as const },
          },
          {
            key: "Materials-Science",
            totalCostUsd: 423.89,
            instanceCount: 6,
            cpuHours: 1080,
            trend: "increasing" as const,
            metadata: { priority: "low" as const },
          },
        ],
        anomalies: {
          detected: true,
          items: [
            {
              bucket: "ML-Research",
              type: "spike" as const,
              severity: "medium" as const,
              description: "40% cost increase detected - new GPU training jobs",
              recommendedAction:
                "Review training job scheduling and resource allocation",
            },
          ],
        },
      };

    case "PROJECT":
      return {
        buckets: [
          {
            key: "cancer-genomics-2024",
            totalCostUsd: 1432.56,
            instanceCount: 18,
            trend: "increasing" as const,
            metadata: { team: "Genomics", priority: "high" as const },
          },
          {
            key: "climate-prediction-v3",
            totalCostUsd: 967.23,
            instanceCount: 14,
            trend: "stable" as const,
            metadata: { team: "Climate-Modeling", priority: "high" as const },
          },
          {
            key: "llm-training-phase2",
            totalCostUsd: 854.91,
            instanceCount: 11,
            trend: "increasing" as const,
            metadata: { team: "ML-Research", priority: "high" as const },
          },
          {
            key: "exoplanet-detection",
            totalCostUsd: 543.67,
            instanceCount: 7,
            trend: "stable" as const,
            metadata: { team: "Astrophysics", priority: "medium" as const },
          },
          {
            key: "protein-folding-sim",
            totalCostUsd: 398.45,
            instanceCount: 5,
            trend: "decreasing" as const,
            metadata: { team: "Materials-Science", priority: "low" as const },
          },
        ],
        anomalies: {
          detected: true,
          items: [
            {
              bucket: "llm-training-phase2",
              type: "unusual_pattern" as const,
              severity: "low" as const,
              description: "Unusual weekend activity detected",
              recommendedAction: "Verify if weekend runs are intentional",
            },
          ],
        },
      };

    case "JOB_TYPE":
      return {
        buckets: [
          {
            key: "gpu-training",
            totalCostUsd: 2134.45,
            instanceCount: 12,
            trend: "increasing" as const,
            metadata: { priority: "high" as const },
          },
          {
            key: "batch-processing",
            totalCostUsd: 1456.78,
            instanceCount: 28,
            trend: "stable" as const,
            metadata: { priority: "medium" as const },
          },
          {
            key: "simulation",
            totalCostUsd: 987.34,
            instanceCount: 16,
            trend: "stable" as const,
            metadata: { priority: "high" as const },
          },
          {
            key: "data-processing",
            totalCostUsd: 654.23,
            instanceCount: 22,
            trend: "decreasing" as const,
            metadata: { priority: "low" as const },
          },
          {
            key: "development",
            totalCostUsd: 234.67,
            instanceCount: 8,
            trend: "stable" as const,
            metadata: { priority: "low" as const },
          },
        ],
        anomalies: {
          detected: true,
          items: [
            {
              bucket: "gpu-training",
              type: "spike" as const,
              severity: "high" as const,
              description: "GPU costs doubled this week",
              recommendedAction:
                "Review GPU instance scheduling and spot pricing",
            },
          ],
        },
      };

    case "RESEARCHER":
      return {
        buckets: [
          {
            key: "dr.chen@university.edu",
            totalCostUsd: 1876.43,
            instanceCount: 15,
            trend: "increasing" as const,
            metadata: { team: "ML-Research", project: "llm-training-phase2" },
          },
          {
            key: "prof.rodriguez@university.edu",
            totalCostUsd: 1234.56,
            instanceCount: 12,
            trend: "stable" as const,
            metadata: { team: "Genomics", project: "cancer-genomics-2024" },
          },
          {
            key: "dr.kim@university.edu",
            totalCostUsd: 987.21,
            instanceCount: 10,
            trend: "decreasing" as const,
            metadata: {
              team: "Climate-Modeling",
              project: "climate-prediction-v3",
            },
          },
          {
            key: "prof.taylor@university.edu",
            totalCostUsd: 654.32,
            instanceCount: 8,
            trend: "stable" as const,
            metadata: { team: "Astrophysics", project: "exoplanet-detection" },
          },
        ],
        anomalies: {
          detected: false,
          items: [],
        },
      };

    default: // REGION, INSTANCE_TYPE, etc.
      return {
        buckets: [
          { key: "us-east-1", totalCostUsd: 2187.45, instanceCount: 45 },
          { key: "us-west-2", totalCostUsd: 1654.18, instanceCount: 32 },
          { key: "eu-west-1", totalCostUsd: 876.23, instanceCount: 18 },
          { key: "ap-southeast-1", totalCostUsd: 467.89, instanceCount: 12 },
        ],
        anomalies: {
          detected: false,
          items: [],
        },
      };
  }
}
