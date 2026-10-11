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

const LINE_COLOR = '#1677ff';
const DONUT_COLORS = ['#1677ff', '#13c2c2', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96', '#8c8c8c', '#fadb14'];

interface LineGraphProps {
  data: {date: string; total: number}[];
}

interface PieGraphProps {
  data: {name: string; value: number}[];
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
          <LineChart data={data} margin={{top: 8, right: 12, left: 0, bottom: 0}}>
            <CartesianGrid stroke="#f0f0f0" vertical={false}/>
            <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
            <YAxis
              tick={{fontSize: 12}}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={formatAxis}
            />
            <Tooltip formatter={(value) => [`₹${formatAxis(Number(value))}`, 'Spent']}/>
            <Line
              type="monotone"
              dataKey="total"
              stroke={LINE_COLOR}
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
              stroke="#fff"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]}/>
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`₹${formatAxis(Number(value))}`, name]}/>
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};
