/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module 'virtual:build-info' {
  export interface BuildInfo {
    version: string;
    buildTime: string;
    buildTimestamp: number;
  }

  export const buildInfo: BuildInfo;
}
