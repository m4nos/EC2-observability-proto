import { NextRequest } from "next/server";
import { InstanceRow } from "@/types/api";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get("region") || "us-east-1";

  // Mock data for testing without AWS credentials
  const mockInstances: InstanceRow[] = [
    {
      instanceId: "i-1234567890abcdef0",
      name: "web-server-prod-01",
      region: region,
      availabilityZone: `${region}a`,
      state: "running",
      instanceType: "t3.medium",
      launchTime: "2024-01-15T10:30:00.000Z",
      tags: {
        Environment: "production",
        Team: "frontend",
        Project: "web-app",
        Backup: "enabled",
      },
      costPerHourUsd: 0.0416,
      cpuUtilizationAvg24h: 45.2,
      cpuUtilizationMax24h: 78.9,
      memoryUtilizationAvg24h: 62.1,
      gpuUtilizationAvg24h: null,
      wasteIndicators: [],
    },
    {
      instanceId: "i-0987654321fedcba0",
      name: "database-master",
      region: region,
      availabilityZone: `${region}b`,
      state: "running",
      instanceType: "r5.large",
      launchTime: "2024-01-10T08:15:00.000Z",
      tags: {
        Environment: "production",
        Team: "backend",
        Project: "database",
        Backup: "enabled",
      },
      costPerHourUsd: 0.126,
      cpuUtilizationAvg24h: 23.7,
      cpuUtilizationMax24h: 45.2,
      memoryUtilizationAvg24h: 89.3,
      gpuUtilizationAvg24h: null,
      wasteIndicators: [],
    },
    {
      instanceId: "i-1122334455667788",
      name: "batch-processor-01",
      region: region,
      availabilityZone: `${region}c`,
      state: "stopped",
      instanceType: "c5.xlarge",
      launchTime: "2024-01-20T14:00:00.000Z",
      tags: {
        Environment: "staging",
        Team: "data",
        Project: "batch-jobs",
        AutoStop: "true",
      },
      costPerHourUsd: 0.17,
      cpuUtilizationAvg24h: null,
      cpuUtilizationMax24h: null,
      memoryUtilizationAvg24h: null,
      gpuUtilizationAvg24h: null,
      wasteIndicators: [
        {
          reason: "Stopped instance still incurring EBS cost",
          severity: "medium",
        },
      ],
    },
    {
      instanceId: "i-9988776655443322",
      name: "dev-test-server",
      region: region,
      availabilityZone: `${region}a`,
      state: "running",
      instanceType: "t3.micro",
      launchTime: "2024-01-25T09:00:00.000Z",
      tags: {
        Environment: "development",
        Team: "qa",
        Project: "testing",
        AutoStop: "true",
      },
      costPerHourUsd: 0.0104,
      cpuUtilizationAvg24h: 3.2,
      cpuUtilizationMax24h: 12.8,
      memoryUtilizationAvg24h: 18.5,
      gpuUtilizationAvg24h: null,
      wasteIndicators: [
        {
          reason: "CPU < 5% avg (24h)",
          severity: "high",
        },
      ],
    },
    {
      instanceId: "i-5566778899aabbcc",
      name: "ml-training-gpu",
      region: region,
      availabilityZone: `${region}b`,
      state: "running",
      instanceType: "p3.2xlarge",
      launchTime: "2024-01-18T16:00:00.000Z",
      tags: {
        Environment: "production",
        Team: "ml",
        Project: "model-training",
        GPU: "v100",
      },
      costPerHourUsd: 3.06,
      cpuUtilizationAvg24h: 67.8,
      cpuUtilizationMax24h: 95.2,
      memoryUtilizationAvg24h: 74.3,
      gpuUtilizationAvg24h: 89.7,
      wasteIndicators: [],
    },
    {
      instanceId: "i-aabbccddeeff1122",
      name: "monitoring-server",
      region: region,
      availabilityZone: `${region}c`,
      state: "running",
      instanceType: "t3.small",
      launchTime: "2024-01-12T11:00:00.000Z",
      tags: {
        Environment: "production",
        Team: "devops",
        Project: "monitoring",
        Backup: "enabled",
      },
      costPerHourUsd: 0.0208,
      cpuUtilizationAvg24h: 28.9,
      cpuUtilizationMax24h: 56.4,
      memoryUtilizationAvg24h: 41.2,
      gpuUtilizationAvg24h: null,
      wasteIndicators: [],
    },
  ];

  // Filter by region if specified
  const filteredInstances =
    region === "all"
      ? mockInstances
      : mockInstances.filter((instance) => instance.region === region);

  return Response.json({ instances: filteredInstances });
}
