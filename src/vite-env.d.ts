/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

/** setupTests.ts assigns `globalThis.jest = vi` so existing tests keep `jest.fn` / `jest.mock`. */
declare const jest: typeof import('vitest')['vitest'];
declare namespace jest {
  // Loose like @types/jest so `as jest.Mock` still type-checks with vitest spies.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Mock = any;
  type Mocked<T> = import('vitest').Mocked<T>;
}

declare const __DEMO_BUILD__: boolean;
/** True only in `vite --mode e2e` builds (Playwright against the Firebase emulators). */
declare const __E2E_EMULATORS__: boolean;

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
