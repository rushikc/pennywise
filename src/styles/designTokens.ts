/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

// Numeric mirror of the size tokens in theme.scss.
// Phone is the default. Desktop applies from DESKTOP_MIN upward.

export const DESKTOP_MIN = 800;

export const brand = {
  primary: '#1c75bd',
  primaryHover: '#155a94',
  primaryOnDark: '#90caf9',
};

export const phone = {
  fontSize: {
    display: 24,
    h1: 20,
    h2: 17,
    title: 15,
    body: 14,
    subtext: 12,
    caption: 11,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  controlHeight: 36,
};

export const desktop = {
  fontSize: {
    display: 28,
    h1: 28,
    h2: 20,
    title: 16,
    body: 15,
    subtext: 13,
    caption: 12,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 40,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  controlHeight: 40,
};

export const chartColors = [
  '#1677ff',
  '#13c2c2',
  '#722ed1',
  '#fa8c16',
  '#52c41a',
  '#eb2f96',
  '#8c8c8c',
  '#fadb14',
];

export const chartLine = chartColors[0];
export const chartGrid = '#f0f0f0';
export const chartStroke = '#ffffff';
