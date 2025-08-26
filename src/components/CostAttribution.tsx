"use client";
import { useState } from "react";
import useSWR from "swr";
import { CostAttribution, DimensionType } from "@/types/api";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Alert,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  Info,
} from "@mui/icons-material";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COLORS = [
  "#60a5fa",
  "#f472b6",
  "#34d399",
  "#f59e0b",
  "#a78bfa",
  "#f87171",
  "#22d3ee",
  "#c084fc",
  "#fbbf24",
  "#fb7185",
  "#34d399",
  "#818cf8",
];

const DIMENSIONS: {
  value: DimensionType;
  label: string;
  description: string;
}[] = [
  {
    value: "TEAM",
    label: "Research Team",
    description: "Group costs by research teams",
  },
  {
    value: "PROJECT",
    label: "Project",
    description: "Group costs by active research projects",
  },
  {
    value: "RESEARCHER",
    label: "Researcher",
    description: "Group costs by individual researchers",
  },
  {
    value: "JOB_TYPE",
    label: "Job Type",
    description: "Group costs by computational job types",
  },
  {
    value: "REGION",
    label: "Region",
    description: "Group costs by AWS regions",
  },
  {
    value: "INSTANCE_TYPE",
    label: "Instance Type",
    description: "Group costs by EC2 instance types",
  },
];

type ViewMode = "chart" | "table" | "grid";

export default function CostAttributionPanel() {
  const [selectedDimension, setSelectedDimension] =
    useState<DimensionType>("TEAM");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [timeRange, setTimeRange] = useState("7");
  const [showComparison, setShowComparison] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Fetch current data
  const { data: currentData } = useSWR<CostAttribution>(
    `/api/cost/attribution-mock?dimension=${selectedDimension}&days=${timeRange}${
      showComparison ? "&compare=true" : ""
    }`,
    fetcher,
    { refreshInterval: 60_000 }
  );

  const buckets = currentData?.buckets?.slice(0, 10) || [];
  const total = currentData?.totalCostUsd || 0;
  const attributed = currentData?.attributedCostUsd || 0;
  const unaccounted = currentData?.unaccountedUsd || 0;
  const hasAnomalies = currentData?.anomalies?.detected || false;

  const getTrendIcon = (trend?: "increasing" | "stable" | "decreasing") => {
    switch (trend) {
      case "increasing":
        return <TrendingUp sx={{ color: "error.main", fontSize: 16 }} />;
      case "decreasing":
        return <TrendingDown sx={{ color: "success.main", fontSize: 16 }} />;
      case "stable":
        return <TrendingFlat sx={{ color: "text.secondary", fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getPriorityColor = (
    priority?: "high" | "medium" | "low"
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Dimension</InputLabel>
              <Select
                value={selectedDimension}
                label="Dimension"
                onChange={(e) =>
                  setSelectedDimension(e.target.value as DimensionType)
                }
              >
                {DIMENSIONS.map((dim) => (
                  <MenuItem key={dim.value} value={dim.value}>
                    <Tooltip title={dim.description} placement="right">
                      <span>{dim.label}</span>
                    </Tooltip>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ minWidth: 140 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="chart">Chart</ToggleButton>
            <ToggleButton value="table">Table</ToggleButton>
            <ToggleButton value="grid">Grid</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  size="small"
                />
              }
              label="Compare"
            />
            {viewMode === "chart" && (
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(_, newType) => newType && setChartType(newType)}
                size="small"
              >
                <ToggleButton value="pie">Pie</ToggleButton>
                <ToggleButton value="bar">Bar</ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>
        </Box>
      </Box>

      {/* Cost Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      >
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
              {formatUsd(total)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cost
            </Typography>
            {showComparison && currentData?.comparison && (
              <Typography
                variant="caption"
                color={
                  currentData.comparison.percentChange! > 0
                    ? "error.main"
                    : "success.main"
                }
              >
                {currentData.comparison.percentChange! > 0 ? "+" : ""}
                {currentData.comparison.percentChange}%
              </Typography>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              color="success.main"
              sx={{ fontWeight: 700 }}
            >
              {formatUsd(attributed)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Attributed Cost
            </Typography>
            <Typography variant="caption">
              {((attributed / Math.max(1, total)) * 100).toFixed(1)}% of total
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography
              variant="h4"
              color="warning.main"
              sx={{ fontWeight: 700 }}
            >
              {formatUsd(unaccounted)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unaccounted Cost
            </Typography>
            <Typography variant="caption">
              {((unaccounted / Math.max(1, total)) * 100).toFixed(1)}% of total
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {buckets.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active{" "}
              {DIMENSIONS.find((d) => d.value === selectedDimension)?.label}s
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Anomaly Alerts */}
      {hasAnomalies &&
        currentData?.anomalies?.items.map((anomaly, index) => (
          <Alert
            key={index}
            severity={
              anomaly.severity === "high"
                ? "error"
                : anomaly.severity === "medium"
                ? "warning"
                : "info"
            }
            sx={{ mb: 2 }}
            action={
              anomaly.recommendedAction && (
                <Tooltip title={anomaly.recommendedAction}>
                  <IconButton size="small">
                    <Info />
                  </IconButton>
                </Tooltip>
              )
            }
          >
            <strong>{anomaly.bucket}:</strong> {anomaly.description}
          </Alert>
        ))}

      {/* Main Content */}
      {viewMode === "chart" && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Cost Distribution by{" "}
            {DIMENSIONS.find((d) => d.value === selectedDimension)?.label}
          </Typography>
          <Box sx={{ height: 400 }}>
            {chartType === "pie" ? (
              <PieChart
                series={[
                  {
                    data: buckets.map((bucket, index) => ({
                      id: bucket.key,
                      value: bucket.totalCostUsd,
                      label: bucket.key,
                      color: COLORS[index % COLORS.length],
                    })),
                    innerRadius: 60,
                    outerRadius: 120,
                    paddingAngle: 2,
                    cornerRadius: 6,
                  },
                ]}
                height={400}
              />
            ) : (
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: buckets.map((b) => b.key),
                  },
                ]}
                series={[
                  {
                    data: buckets.map((b) => b.totalCostUsd),
                    color: COLORS[0],
                    valueFormatter: (value) => formatUsd(value || 0),
                  },
                ]}
                height={400}
              />
            )}
          </Box>
        </Paper>
      )}

      {viewMode === "table" && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Detailed Breakdown by{" "}
            {DIMENSIONS.find((d) => d.value === selectedDimension)?.label}
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  {DIMENSIONS.find((d) => d.value === selectedDimension)?.label}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>% of Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Instances</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trend</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {buckets.map((bucket, index) => (
                <TableRow
                  key={bucket.key}
                  sx={{
                    backgroundColor:
                      index % 2 === 0 ? "action.hover" : "transparent",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: 1,
                        }}
                      />
                      {bucket.key}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {formatUsd(bucket.totalCostUsd)}
                  </TableCell>
                  <TableCell>
                    {((bucket.totalCostUsd / Math.max(1, total)) * 100).toFixed(
                      1
                    )}
                    %
                  </TableCell>
                  <TableCell>{bucket.instanceCount || "—"}</TableCell>
                  <TableCell>{getTrendIcon(bucket.trend)}</TableCell>
                  <TableCell>
                    {bucket.metadata?.priority && (
                      <Chip
                        label={bucket.metadata.priority}
                        size="small"
                        color={getPriorityColor(bucket.metadata.priority)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {unaccounted > 0 && (
                <TableRow sx={{ borderTop: 2, borderColor: "divider" }}>
                  <TableCell sx={{ opacity: 0.8, fontStyle: "italic" }}>
                    Unaccounted
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {formatUsd(unaccounted)}
                  </TableCell>
                  <TableCell>
                    {((unaccounted / Math.max(1, total)) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {viewMode === "grid" && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 2,
          }}
        >
          {buckets.map((bucket) => (
            <Card key={bucket.key} sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {bucket.key}
                  </Typography>
                  {getTrendIcon(bucket.trend)}
                </Box>

                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: 700, mb: 1 }}
                >
                  {formatUsd(bucket.totalCostUsd)}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {((bucket.totalCostUsd / Math.max(1, total)) * 100).toFixed(
                    1
                  )}
                  % of total
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {bucket.instanceCount && (
                    <Chip
                      label={`${bucket.instanceCount} instances`}
                      size="small"
                    />
                  )}
                  {bucket.metadata?.priority && (
                    <Chip
                      label={bucket.metadata.priority}
                      size="small"
                      color={getPriorityColor(bucket.metadata.priority)}
                    />
                  )}
                  {bucket.metadata?.team && (
                    <Chip
                      label={bucket.metadata.team}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
