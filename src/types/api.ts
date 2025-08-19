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
  series7d: { date: string; costUsd: number }[];
};

export type AttributionBucket = {
  key: string;
  totalCostUsd: number;
};

export type CostAttribution = {
  dimension: string;
  timeRange: { start: string; end: string };
  totalCostUsd: number;
  buckets: AttributionBucket[];
  unaccountedUsd?: number;
};
