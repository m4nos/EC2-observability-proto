"use client";

import useSWR from "swr";
import { InstanceRow } from "@/types/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Chip, Typography } from "@mui/material";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ApiResponse = { instances: InstanceRow[] };

export default function InstanceTable() {
  const { data } = useSWR<ApiResponse>("/api/ec2/instances-mock", fetcher, {
    refreshInterval: 60_000,
  });
  const rows = data?.instances || [];

  const columns: GridColDef[] = [
    {
      field: "instance",
      headerName: "Instance",
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{params.row.name}</Typography>
          <Typography sx={{ fontSize: 10, opacity: 0.7 }}>
            {params.row.instanceId}
          </Typography>
        </Box>
      ),
    },
    {
      field: "region",
      headerName: "Region",
      width: 120,
      filterable: true,
    },
    {
      field: "instanceType",
      headerName: "Type",
      width: 120,
      filterable: true,
    },
    {
      field: "state",
      headerName: "State",
      width: 100,
      filterable: true,
    },
    {
      field: "cpuUtilizationAvg24h",
      headerName: "CPU avg (24h)",
      width: 130,
      type: "number",
      renderCell: (params) => {
        const value = params.row.cpuUtilizationAvg24h;
        if (value == null) return "—";
        return `${value.toFixed(1)}%`;
      },
    },
    {
      field: "cpuUtilizationMax24h",
      headerName: "CPU max (24h)",
      width: 130,
      type: "number",
      renderCell: (params) => {
        const value = params.row.cpuUtilizationMax24h;
        if (value == null) return "—";
        return `${value.toFixed(1)}%`;
      },
    },
    {
      field: "costPerHourUsd",
      headerName: "$/hr",
      width: 100,
      type: "number",
      renderCell: (params) => {
        const value = params.row.costPerHourUsd;
        if (value == null) return "—";
        return `$${value.toFixed(3)}`;
      },
    },
    {
      field: "wasteIndicators",
      headerName: "Waste",
      width: 400,
      sortable: false,
      renderCell: (params) => (
        <WastePills indicators={params.row.wasteIndicators} />
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.instanceId}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "instance", sort: "asc" }],
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        disableColumnResize
      />
    </Box>
  );
}

function WastePills({
  indicators,
}: {
  indicators: InstanceRow["wasteIndicators"];
}) {
  if (!indicators || indicators.length === 0)
    return <Chip label="None" size="small" sx={{ opacity: 0.5 }} />;

  return indicators.map((i, idx) => (
    <Chip
      key={idx}
      label={i.reason}
      size="small"
      sx={{
        fontSize: 12,
        backgroundColor:
          i.severity === "high"
            ? "#7f1d1d"
            : i.severity === "medium"
            ? "#78350f"
            : "#1f2937",
        color: "white",
        border: "1px solid #222",
        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  ));
}
