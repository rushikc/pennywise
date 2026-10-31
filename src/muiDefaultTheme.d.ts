declare module '@mui/material/node/useLazyRipple/useLazyRipple.js' {
  export class LazyRipple {
    start(...args: unknown[]): void;
    stop(...args: unknown[]): void;
    pulsate(...args: unknown[]): void;
  }
}

declare module '@mui/material/node/styles/defaultTheme.js' {
  import type {Theme} from '@mui/material/styles';
  const theme: Theme;
  export default theme;
}
