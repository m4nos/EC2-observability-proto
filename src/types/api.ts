export type InstanceWasteIndicator = {
  reason: string;
  severity: "low" | "medium" | "high";
};

export type InstanceRow = {
  instanceId: string;
  name?: string;
  region: string;
  availabilityZone?: string;
  state: string;
  instanceType: string;
  launchTime?: string;
  tags?: Record<string, string>;
  costPerHourUsd?: number | null;
  cpuUtilizationAvg24h?: number | null;
  cpuUtilizationMax24h?: number | null;
  memoryUtilizationAvg24h?: number | null;
  gpuUtilizationAvg24h?: number | null;
  wasteIndicators: InstanceWasteIndicator[];
};

export type CostKpis = {
  totalCostUsd: number;
  dailyBurnUsd: number;
  projectedMonthlyUsd: number;
  lastUpdated: string;
  anomaly?: { present: boolean; message?: string };
  series7d: { date: string; costUsd: number }[]; // Note: Can contain 7 or 30 days based on preview mode
  efficiency?: {
    wasteEstimateUsd?: number;
    utilizationScore?: number; // 0-100
    savingsOpportunityUsd?: number;
  };
};

export type AttributionBucket = {
  key: string;
  totalCostUsd: number;
  instanceCount?: number;
  cpuHours?: number;
  trend?: "increasing" | "stable" | "decreasing";
  metadata?: {
    team?: string;
    project?: string;
    researcher?: string;
    jobType?: string;
    priority?: "high" | "medium" | "low";
  };
};

export type DimensionType =
  | "REGION"
  | "INSTANCE_TYPE"
  | "TEAM"
  | "PROJECT"
  | "RESEARCHER"
  | "JOB_TYPE"
  | "USAGE_TYPE"
  | "AZ";

export type CostAttribution = {
  dimension: DimensionType;
  timeRange: { start: string; end: string };
  totalCostUsd: number;
  attributedCostUsd: number;
  buckets: AttributionBucket[];
  unaccountedUsd?: number;
  comparison?: {
    previousPeriod?: CostAttribution;
    percentChange?: number;
  };
  anomalies?: {
    detected: boolean;
    items: Array<{
      bucket: string;
      type: "spike" | "unusual_pattern" | "new_expense";
      severity: "low" | "medium" | "high";
      description: string;
      recommendedAction?: string;
    }>;
  };
};
