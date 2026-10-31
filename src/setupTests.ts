/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import {vi} from 'vitest';
import {LazyRipple} from '@mui/material/node/useLazyRipple/useLazyRipple.js';
import defaultTheme from '@mui/material/node/styles/defaultTheme.js';

Object.defineProperty(globalThis, 'jest', {
  configurable: true,
  writable: true,
  value: vi,
});

// MUI dialogs and ripples schedule updates after the assertion. Zero the
// default theme durations and skip ripples so those updates settle inside act.
const durations = defaultTheme.transitions.duration;
(Object.keys(durations) as Array<keyof typeof durations>).forEach((key) => {
  durations[key] = 0;
});

// Ripple mount resolves on a promise and then setStates after the click's act().
LazyRipple.prototype.start = () => undefined;
LazyRipple.prototype.stop = () => undefined;
LazyRipple.prototype.pulsate = () => undefined;
