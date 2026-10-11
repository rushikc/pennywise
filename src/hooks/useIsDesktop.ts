/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import useMediaQuery from '@mui/material/useMediaQuery';
import {useTheme} from '@mui/material/styles';

/** Desktop layout starts at 800px. */
export const useIsDesktop = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up(800), {noSsr: true});
};
