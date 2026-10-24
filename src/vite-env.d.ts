/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

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

declare global {
  interface GisCodeClient {
    requestCode: () => void;
  }

  interface GisCodeResponse {
    code?: string;
    error?: string;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient: (config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup' | 'redirect';
            access_type?: string;
            prompt?: string;
            callback: (response: GisCodeResponse) => void;
          }) => GisCodeClient;
        };
      };
    };
  }
}

export {};

declare module 'virtual:build-info' {
  export interface BuildInfo {
    version: string;
    buildTime: string;
    buildTimestamp: number;
  }

  export const buildInfo: BuildInfo;
}
