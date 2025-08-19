## EC2 Observability Prototype

This prototype provides a minimal, actionable dashboard for EC2 utilisation and cost:

- Live cost KPIs (7d total, daily burn, projected month)
- EC2 instance table with 24h CPU metrics and waste indicators
- Cost attribution breakdown by Cost Explorer dimension (default: REGION)

### Run locally

1. Install deps

```bash
npm install
```

2. Configure AWS credentials. Any standard AWS mechanism works:

- `AWS_AUTH_MODE=profile` + `AWS_PROFILE=your_profile`
- `AWS_AUTH_MODE=env` + `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
- Default chain if not set

Set a region with `AWS_REGION` (default `us-east-1`). Optionally restrict to specific regions via `ALLOWED_REGIONS` (comma-separated).

3. Start

```bash
npm run dev
```

### Required AWS permissions and setup

1. **Apply the IAM policy** (see `aws-policy.json`):

```bash
aws iam create-policy --policy-name EC2ObservabilityPolicy --policy-document file://aws-policy.json
aws iam attach-user-policy --user-name YOUR_USERNAME --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/EC2ObservabilityPolicy
```

2. **Enable Cost Explorer** (24h delay for data):

   - AWS Console → Billing → Cost Explorer → Enable
   - Or run: `aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-02 --granularity DAILY --metrics UnblendedCost`

3. **For immediate testing**: The app uses mock cost data (`/api/cost/*-mock`) until Cost Explorer is enabled.

### Design notes

- UX tradeoff: fewer columns with strong visual waste pills for faster scanning; details can move to a row drawer later.
- Waste assumption: consistently low CPU (<5% avg over 24h) on running instances; stopped instances flagged for EBS costs.
- Not built: tag-based per-job/team attribution to avoid setup friction in a take-home; CE dimensions provide quick value.
  This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
