import { EC2Client } from "@aws-sdk/client-ec2";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { CostExplorerClient } from "@aws-sdk/client-cost-explorer";
import {
  fromEnv,
  fromIni,
  fromSSO,
  fromTokenFile,
  fromNodeProviderChain,
} from "@aws-sdk/credential-providers";

export type AwsClients = {
  ec2: EC2Client;
  cloudwatch: CloudWatchClient;
  costExplorer: CostExplorerClient;
};

function getCredentials() {
  const mode = process.env.AWS_AUTH_MODE || "default";
  if (mode === "env") return fromEnv();
  if (mode === "profile")
    return fromIni({ profile: process.env.AWS_PROFILE || "default" });
  if (mode === "sso") return fromSSO();
  if (mode === "web-identity") return fromTokenFile();
  return fromNodeProviderChain();
}

export function resolveRegion(preferred?: string) {
  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  return preferred || envRegion || "us-east-1";
}

export function createAwsClients(region?: string): AwsClients {
  const resolvedRegion = resolveRegion(region);
  const credentials = getCredentials();
  return {
    ec2: new EC2Client({ region: resolvedRegion, credentials }),
    cloudwatch: new CloudWatchClient({ region: resolvedRegion, credentials }),
    costExplorer: new CostExplorerClient({ region: "us-east-1", credentials }),
  };
}

export function getAllowedRegions(): string[] | undefined {
  const str = process.env.ALLOWED_REGIONS;
  if (!str) return undefined;
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// AWS region code => Pricing API location name mapping (partial, extend as needed)
export const REGION_TO_LOCATION: Record<string, string> = {
  "us-east-1": "US East (N. Virginia)",
  "us-east-2": "US East (Ohio)",
  "us-west-2": "US West (Oregon)",
  "eu-west-1": "EU (Ireland)",
  "eu-central-1": "EU (Frankfurt)",
  "eu-west-2": "EU (London)",
};
