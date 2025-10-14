/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {Box, Paper, Typography, useTheme, IconButton} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Interface for line graph data
interface LineDataPoint {
  date: string;

  [key: string]: string | number;
}

interface PieDataPoint {
  name: string;
  value: number;
}

const truncate = (str: string, n: number) => {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
};

interface LineGraphProps {
  data: LineDataPoint[];
  lineKeys: string[];
  title?: string;
}

interface PieGraphProps {
  data: PieDataPoint[];
  title?: string;
  onSelectionToggle?: () => void;
}

export const LineGraph: React.FC<LineGraphProps> = ({
  data,
  lineKeys,
  title = 'Spending Trends'
}) => {
  const theme = useTheme();

  const lineColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ];

  if (data.length === 0) {
    return (
      <Box className="line-chart-container">
        <Paper className="chart-paper empty-chart" elevation={3}>
          <Typography variant="body1" color="text.secondary">
            No data available for the selected filters
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="line-chart-container">
      <Paper className="chart-paper" elevation={3}>
        <Typography variant="subtitle2" className="chart-title">
          {title}
        </Typography>
        <ResponsiveContainer width="100%" height="95%">
          <LineChart
            data={data}
            margin={{top: 5, right: 20, left: 10, bottom: 5}}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider}/>
            <XAxis
              dataKey="date"
              stroke={theme.palette.text.secondary}
              tick={{fontSize: 12}}
              tickLine={{stroke: theme.palette.divider}}
            />
            <YAxis
              stroke={theme.palette.text.secondary}
              tick={{fontSize: 12}}
              tickLine={{stroke: theme.palette.divider}}
              width={50}
              tickFormatter={(value) => `₹${value}`}
              domain={['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px'
              }}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{fontSize: '12px', whiteSpace: 'normal'}}
              formatter={(value) => truncate(value, 20)}
            />
            {lineKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={lineColors[index % lineColors.length]}
                activeDot={{r: 8}}
                strokeWidth={2}
                dot={{strokeWidth: 2}}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export const PieGraph: React.FC<PieGraphProps> = ({
  data,
  title = 'Group Distribution',
  onSelectionToggle
}) => {
  const theme = useTheme();

  const lineColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.warning.main
  ];

  if (data.length === 0) {
    return (
      <Paper className="chart-paper empty-chart" elevation={3}>
        <Typography variant="body1" color="text.secondary">
          No data available for the selected filters
        </Typography>
      </Paper>
    );
  }

  return (
    <Box className="pie-chart-container">
      <Paper className="chart-paper" elevation={3}>
        <div className="chart-header">
          <Typography variant="subtitle2" className="chart-title">
            {title}
          </Typography>
          {onSelectionToggle && (
            <div className="selection-button-inline">
              <IconButton
                onClick={onSelectionToggle}
                size="small"
              >
                <TuneIcon/>
              </IconButton>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={330}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              style={{marginTop: 20}}
              outerRadius={70}
              innerRadius={55}
              fill={theme.palette.primary.main}
              label={(entry) => `₹${Math.round(Number(entry.value) || 0)}`}
            >
              {data.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={lineColors[index % lineColors.length]}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{fontSize: '12px', whiteSpace: 'normal'}}
              formatter={(value) => truncate(value, 20)}
            />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};
