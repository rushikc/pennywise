/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {Card} from 'antd';
import TuneIcon from '@mui/icons-material/Tune';
import IconButton from '@mui/material/IconButton';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {chartColors, chartGrid, chartLine, chartStroke, phone} from '../../styles/designTokens';

const gridColor = () => {
  if (typeof document === 'undefined') {
    return chartGrid;
  }
  return getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || chartGrid;
};

interface LineGraphProps {
  data: {date: string; total: number}[];
}

interface PieGraphProps {
  data: {name: string; value: number; unlisted?: boolean}[];
  onSelectionToggle?: () => void;
}

const formatAxis = (value: number) => Math.round(value).toLocaleString('en-IN');

export const LineGraph: React.FC<LineGraphProps> = ({data}) => {
  return (
    <Card title="Spending trend" className="insights-chart-card">
      {data.length === 0 ? (
        <div className="insights-chart-empty">No data available for the selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{top: phone.space.sm, right: phone.space.md, left: 0, bottom: 0}}>
            <CartesianGrid stroke={gridColor()} vertical={false}/>
            <XAxis dataKey="date" tick={{fontSize: phone.fontSize.subtext}} tickLine={false} axisLine={false}/>
            <YAxis
              tick={{fontSize: phone.fontSize.subtext}}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={formatAxis}
            />
            <Tooltip formatter={(value) => [`₹${formatAxis(Number(value))}`, 'Spent']}/>
            <Line
              type="monotone"
              dataKey="total"
              stroke={chartLine}
              strokeWidth={2}
              dot={false}
              activeDot={{r: 4}}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export const PieGraph: React.FC<PieGraphProps> = ({data, onSelectionToggle}) => {
  return (
    <Card
      title="Distribution"
      className="insights-chart-card"
      extra={onSelectionToggle ? (
        <IconButton aria-label="Choose groups" onClick={onSelectionToggle} size="small">
          <TuneIcon fontSize="small"/>
        </IconButton>
      ) : undefined}
    >
      {data.length === 0 ? (
        <div className="insights-chart-empty">No data available for the selected filters</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              stroke={chartStroke}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={chartColors[index % chartColors.length]}/>
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, item) => {
                const unlisted = Boolean((item?.payload as {unlisted?: boolean} | undefined)?.unlisted);
                const label = unlisted ? `${name} (not in list)` : String(name);
                return [`₹${formatAxis(Number(value))}`, label];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
