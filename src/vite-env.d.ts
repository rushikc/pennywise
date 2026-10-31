/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare const __DEMO_BUILD__: boolean;

declare module '../../shared/tagCases.json' {
  const value: {
    normalizeTags: Array<{
      name: string;
      primary: string | null;
      extras: string[];
      opts?: {tagList?: string[]; legacyTagList?: string[]};
      expected: {tags: string[]; dropped: string[]};
    }>;
    readTags: Array<{
      name: string;
      doc: {tags?: unknown; tag?: unknown};
      expected: string[];
    }>;
    description: Array<{
      name: string;
      input: string | null;
      expected?: string | null;
      repeat?: number;
      expectedLength?: number;
    }>;
    tagListStatus: Array<{
      name: string;
      tag: string;
      tagList: string[];
      legacyTagList: string[];
      expected: 'active' | 'retired' | 'unlisted' | null;
    }>;
    sameTag: Array<{
      name: string;
      left: string;
      right: string;
      expected: boolean;
    }>;
  };
  export default value;
}

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
