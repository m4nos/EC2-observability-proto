"use client";
import useSWR from "swr";
import { CostKpis } from "@/types/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  Speed,
  Timeline,
  AccountBalance,
  Lightbulb,
  Nature,
  TrendingFlat,
  CalendarToday,
  DateRange,
} from "@mui/icons-material";
import { BarChart } from "@mui/x-charts";
import React from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KPIs() {
  const [previewMode, setPreviewMode] = React.useState<"7d" | "30d">("7d");

  // Use mock data until Cost Explorer is enabled (24h delay)
  const apiUrl = `/api/cost/kpis-mock${
    previewMode === "30d" ? "?preview30d=true" : ""
  }`;
  const { data } = useSWR<CostKpis>(apiUrl, fetcher, {
    refreshInterval: 60_000,
  });
  const k = data;

  // Calculate metrics for decision support
  const seriesLength = k?.series7d?.length || 0;
  const avgDailyCost = k && k.series7d ? k.totalCostUsd / seriesLength : 0;
  const costTrend =
    k?.series7d && k.series7d.length >= 2 && k.dailyBurnUsd
      ? ((k.dailyBurnUsd - k.series7d[k.series7d.length - 2].costUsd) /
          k.series7d[k.series7d.length - 2].costUsd) *
        100
      : 0;
  const burnRateHealth = k?.anomaly?.present
    ? "high"
    : costTrend > 10
    ? "medium"
    : "low";
  const projectedBudgetImpact = k
    ? ((k.projectedMonthlyUsd - 1500) / 1500) * 100
    : 0; // Assuming $1500 budget

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header with Preview Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Live Cloud Cost Overview
        </Typography>

        <ToggleButtonGroup
          value={previewMode}
          exclusive
          onChange={(_, newMode) => newMode && setPreviewMode(newMode)}
          size="small"
          sx={{ bgcolor: "background.paper" }}
        >
          <ToggleButton value="7d" sx={{ px: 2 }}>
            <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />7 Days
          </ToggleButton>
          <ToggleButton value="30d" sx={{ px: 2 }}>
            <DateRange sx={{ fontSize: 16, mr: 0.5 }} />
            30 Days
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Health Status Banner */}
      {k?.anomaly?.present && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{
            fontWeight: 600,
            borderLeft: 4,
            borderLeftColor: "warning.main",
          }}
          action={
            <Tooltip title="Review cost attribution and instance optimization">
              <IconButton size="small" color="inherit">
                <Info />
              </IconButton>
            </Tooltip>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Cost Anomaly Detected
          </Typography>
          <Typography variant="body2">
            {k.anomaly.message} - Immediate review recommended
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2 }}>
        {/* Main KPI Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1.5,
          }}
        >
          <KpiCard
            title={`${previewMode === "30d" ? "30-Day" : "7-Day"} Total`}
            value={formatUsd(k?.totalCostUsd)}
            subtitle={`Avg: ${formatUsd(avgDailyCost)} /day`}
            icon={<AccountBalance />}
            trend={costTrend}
          />
          <KpiCard
            title="Current Burn Rate"
            value={formatUsd(k?.dailyBurnUsd)}
            subtitle={`vs yesterday: ${
              costTrend > 0 ? "+" : ""
            }${costTrend.toFixed(1)}%`}
            highlight={k?.anomaly?.present}
            icon={<Speed />}
            healthStatus={burnRateHealth}
          />
          <KpiCard
            title="Projected Monthly"
            value={formatUsd(k?.projectedMonthlyUsd)}
            subtitle={
              projectedBudgetImpact > 0
                ? `${projectedBudgetImpact.toFixed(0)}% over budget`
                : "Within budget"
            }
            icon={<Timeline />}
            budgetImpact={projectedBudgetImpact}
          />
        </Box>
      </Box>

      {/* Enhanced Trend Visualization */}
      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Timeline fontSize="small" />
            {seriesLength}-Day Cost Trend
          </Typography>
          <Chip
            size="small"
            label={`Avg: ${formatUsd(avgDailyCost)}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <BarChart
          dataset={k?.series7d || []}
          xAxis={[
            {
              dataKey: "date",
              scaleType: "band",
              tickLabelInterval: seriesLength > 14 ? "auto" : undefined, // Show fewer labels for 30-day view
            },
          ]}
          yAxis={[
            {
              scaleType: "linear",
            },
          ]}
          series={[
            {
              dataKey: "costUsd",
              color: k?.anomaly?.present ? "#ef4444" : "#3b82f6",
            },
          ]}
          height={seriesLength > 14 ? 220 : 180} // Taller chart for 30-day data
          margin={{
            top: 20,
            bottom: seriesLength > 14 ? 50 : 40, // More space for labels
            left: 50,
            right: 20,
          }}
          grid={{ horizontal: true, vertical: false }}
        />

        {/* Baseline indicator */}
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 2,
                bgcolor: k?.anomaly?.present ? "#ef4444" : "#3b82f6",
              }}
            />
            <Typography variant="caption">Daily Cost</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 1,
                bgcolor: "text.secondary",
                opacity: 0.5,
              }}
            />
            <Typography variant="caption">
              {seriesLength}-Day Average: {formatUsd(avgDailyCost)}
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Cost Efficiency Panel */}
      {k?.efficiency && (
        <Card sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Nature fontSize="small" />
            Cost Efficiency Overview
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 2,
            }}
          >
            <EfficiencyMetric
              icon={<Lightbulb />}
              title="Waste Estimate"
              value={formatUsd(k.efficiency.wasteEstimateUsd)}
              percentage={
                k.efficiency.wasteEstimateUsd
                  ? Math.round(
                      (k.efficiency.wasteEstimateUsd / k.totalCostUsd) * 100
                    )
                  : 0
              }
              color="warning"
            />

            <EfficiencyMetric
              icon={<Speed />}
              title="Utilization Score"
              value={`${k.efficiency.utilizationScore}%`}
              percentage={k.efficiency.utilizationScore || 0}
              color={
                (k.efficiency.utilizationScore || 0) >= 80
                  ? "success"
                  : (k.efficiency.utilizationScore || 0) >= 60
                  ? "warning"
                  : "error"
              }
              isScore={true}
            />

            <EfficiencyMetric
              icon={<TrendingFlat />}
              title="Savings Opportunity"
              value={formatUsd(k.efficiency.savingsOpportunityUsd)}
              percentage={
                k.efficiency.savingsOpportunityUsd
                  ? Math.round(
                      (k.efficiency.savingsOpportunityUsd /
                        k.projectedMonthlyUsd) *
                        100
                    )
                  : 0
              }
              color="info"
            />
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: "info.light",
              borderRadius: 1,
              border: 1,
              borderColor: "info.main",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "info.contrastText",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Lightbulb fontSize="small" />
              Optimization Recommendations:
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "info.contrastText", mt: 0.5 }}
            >
              {k.efficiency.utilizationScore &&
              k.efficiency.utilizationScore < 70
                ? "• Review underutilized instances • Consider rightsizing • Evaluate Reserved Instances"
                : "• Monitor for optimization opportunities • Consider Spot instances • Review auto-scaling policies"}
            </Typography>
          </Box>
        </Card>
      )}
    </Box>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  highlight,
  icon,
  trend,
  healthStatus,
  budgetImpact,
}: {
  title: string;
  value?: string;
  subtitle?: string;
  highlight?: boolean;
  icon?: React.ReactNode;
  trend?: number;
  healthStatus?: "low" | "medium" | "high";
  budgetImpact?: number;
}) {
  const getHealthColor = (status?: string) => {
    switch (status) {
      case "high":
        return "error.main";
      case "medium":
        return "warning.main";
      case "low":
        return "success.main";
      default:
        return "text.secondary";
    }
  };

  const getBudgetColor = (impact?: number) => {
    if (!impact) return "text.secondary";
    if (impact <= 0) return "success.main";
    if (impact <= 20) return "warning.main";
    return "error.main";
  };

  return (
    <Card
      sx={{
        background: highlight ? "error.light" : "background.paper",
        color: highlight ? "error.main" : "text.primary",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: highlight ? 2 : 1,
        borderColor: highlight ? "error.main" : "divider",
        position: "relative",
        overflow: "visible",
      }}
    >
      {highlight && (
        <Box
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            bgcolor: "error.main",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Warning sx={{ fontSize: 16, color: "error.contrastText" }} />
        </Box>
      )}

      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          {icon && (
            <Box sx={{ opacity: 0.7, fontSize: "0.875rem" }}>{icon}</Box>
          )}
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {title}
          </Typography>
          {healthStatus && (
            <Box
              sx={{
                ml: "auto",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: getHealthColor(healthStatus),
              }}
            />
          )}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value ?? "—"}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              opacity: 0.8,
              color: budgetImpact ? getBudgetColor(budgetImpact) : "inherit",
            }}
          >
            {subtitle}
          </Typography>
        )}

        {trend !== undefined && Math.abs(trend) > 5 && (
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            {trend > 0 ? (
              <TrendingUp sx={{ fontSize: 16, color: "error.main" }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: "success.main" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: trend > 0 ? "error.main" : "success.main",
              }}
            >
              {Math.abs(trend).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function EfficiencyMetric({
  icon,
  title,
  value,
  percentage,
  color,
  isScore = false,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  percentage: number;
  color: "success" | "warning" | "error" | "info";
  isScore?: boolean;
}) {
  return (
    <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {value ?? "—"}
      </Typography>

      <Box sx={{ mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={isScore ? percentage : Math.min(percentage, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: `${color}.light`,
            "& .MuiLinearProgress-bar": {
              bgcolor: `${color}.main`,
              borderRadius: 3,
            },
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{ color: `${color}.main`, fontWeight: 600 }}
      >
        {isScore
          ? `${
              percentage >= 80
                ? "Excellent"
                : percentage >= 60
                ? "Good"
                : "Needs attention"
            }`
          : `${percentage}% of ${isScore ? "target" : "total cost"}`}
      </Typography>
    </Box>
  );
}

function formatUsd(n?: number) {
  if (n == null) return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
