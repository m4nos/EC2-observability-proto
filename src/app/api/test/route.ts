import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Mock data to test the frontend without AWS permissions
  return Response.json({
    status: "OK",
    message: "Test endpoint working",
    awsConfig: {
      region: process.env.AWS_REGION || "not-set",
      authMode: process.env.AWS_AUTH_MODE || "not-set",
    },
  });
}
