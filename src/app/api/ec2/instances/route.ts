import { NextRequest } from "next/server";
import { createAwsClients, getAllowedRegions } from "@/lib/aws";
import {
  DescribeInstancesCommand,
  DescribeInstancesCommandOutput,
} from "@aws-sdk/client-ec2";
import {
  GetMetricStatisticsCommand,
  CloudWatchClient,
  Datapoint,
} from "@aws-sdk/client-cloudwatch";
import { InstanceRow } from "@/types/api";

type CpuMetrics = { avg: number | null; max: number | null };

async function fetchCpuMetrics(
  cloudwatch: CloudWatchClient,
  region: string,
  instanceId: string
): Promise<CpuMetrics> {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const cmd = new GetMetricStatisticsCommand({
    Namespace: "AWS/EC2",
    MetricName: "CPUUtilization",
    Dimensions: [{ Name: "InstanceId", Value: instanceId }],
    StartTime: start,
    EndTime: end,
    Period: 300,
    Statistics: ["Average", "Maximum"],
  });
  const res = await cloudwatch.send(cmd);
  const points = (res.Datapoints || []).sort(
    (a: Datapoint, b: Datapoint) =>
      (a.Timestamp?.getTime() || 0) - (b.Timestamp?.getTime() || 0)
  );
  if (points.length === 0)
    return { avg: null as number | null, max: null as number | null };
  const avg =
    points.reduce((sum: number, p: Datapoint) => sum + (p.Average || 0), 0) /
    points.length;
  const max = Math.max(...points.map((p: Datapoint) => p.Maximum || 0));
  return { avg, max };
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const region = searchParams.get("region") || undefined;
    const allowed = getAllowedRegions();
    const targetRegions = allowed || [
      region || process.env.AWS_REGION || "us-east-1",
    ];

    const results: InstanceRow[] = [];

    for (const reg of targetRegions) {
      const { ec2, cloudwatch } = createAwsClients(reg);
      let nextToken: string | undefined = undefined;
      do {
        const res: DescribeInstancesCommandOutput = await ec2.send(
          new DescribeInstancesCommand({ NextToken: nextToken })
        );
        nextToken = res.NextToken;
        const reservations = res.Reservations || [];
        for (const r of reservations) {
          const instances = r.Instances || [];
          for (const i of instances) {
            const nameTag = (i.Tags || []).find(
              (t: { Key?: string; Value?: string }) => t.Key === "Name"
            )?.Value;
            const id = i.InstanceId!;
            const cpu = await fetchCpuMetrics(cloudwatch, reg, id);
            const state = i.State?.Name || "unknown";
            const launchTime = i.LaunchTime?.toISOString();
            const tags: Record<string, string> = {};
            (i.Tags || []).forEach((t: { Key?: string; Value?: string }) => {
              if (t.Key && t.Value) tags[t.Key] = t.Value;
            });

            const wasteIndicators = [] as InstanceRow["wasteIndicators"];
            if ((cpu.avg ?? 0) < 5 && state === "running") {
              wasteIndicators.push({
                reason: "CPU < 5% avg (24h)",
                severity: "high",
              });
            }
            if (state === "stopped") {
              wasteIndicators.push({
                reason: "Stopped instance still incurring EBS cost",
                severity: "medium",
              });
            }

            results.push({
              instanceId: id,
              name: nameTag,
              region: reg,
              availabilityZone: i.Placement?.AvailabilityZone,
              state,
              instanceType: i.InstanceType || "unknown",
              launchTime,
              tags,
              costPerHourUsd: null,
              cpuUtilizationAvg24h: cpu.avg,
              cpuUtilizationMax24h: cpu.max,
              memoryUtilizationAvg24h: null,
              gpuUtilizationAvg24h: null,
              wasteIndicators,
            });
          }
        }
      } while (nextToken);
    }

    return Response.json({ instances: results });
  } catch (error: any) {
    console.error("EC2 instances API error:", error);
    return Response.json(
      {
        error: error.name || "Unknown error",
        message: error.message || "Failed to fetch EC2 instances",
        details:
          error.name === "AccessDeniedException"
            ? "Missing EC2/CloudWatch permissions. See README for required IAM policy."
            : undefined,
      },
      { status: 500 }
    );
  }
}
