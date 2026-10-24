/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import {vi} from 'vitest';

Object.defineProperty(globalThis, 'jest', {
  configurable: true,
  writable: true,
  value: vi,
});
