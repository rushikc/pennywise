/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createTheme, Theme} from '@mui/material/styles';
import {brand, DESKTOP_MIN, desktop, phone} from './designTokens';

type FontSizeKey = 'h1' | 'h2' | 'title' | 'body' | 'subtext' | 'caption';

const responsiveFont = (
  theme: Theme,
  size: FontSizeKey,
  weight: number,
) => ({
  fontSize: `${phone.fontSize[size]}px`,
  fontWeight: weight,
  [theme.breakpoints.up(DESKTOP_MIN)]: {
    fontSize: `${desktop.fontSize[size]}px`,
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  const base = createTheme({
    spacing: 4,
    shape: {borderRadius: phone.radius.md},
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? brand.primaryOnDark : brand.primary,
        dark: brand.primaryHover,
      },
    },
  });

  return createTheme(base, {
    typography: {
      fontSize: phone.fontSize.body,
      h4: responsiveFont(base, 'h1', 700),
      h5: responsiveFont(base, 'h2', 600),
      h6: responsiveFont(base, 'title', 600),
      subtitle1: responsiveFont(base, 'title', 500),
      body1: responsiveFont(base, 'body', 400),
      body2: responsiveFont(base, 'subtext', 400),
      caption: responsiveFont(base, 'caption', 400),
      overline: responsiveFont(base, 'caption', 500),
    },
  });
};
