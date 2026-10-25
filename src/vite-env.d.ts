/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare const __DEMO_BUILD__: boolean;

declare module '../../shared/gcpNames.json' {
  const value: {
    pubsubTopic: string;
    functionsServiceAccountId: string;
    functionsRegion: string;
    oauthClientSecretId: string;
    geminiApiKeySecretId: string;
    gmailRefreshTokenPrefix: string;
    gmailReadonlyScope: string;
  };
  export default value;
}

declare module 'virtual:build-info' {
  export interface BuildInfo {
    version: string;
    buildTime: string;
    buildTimestamp: number;
  }

  export const buildInfo: BuildInfo;
}
