/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import {visualizer} from 'rollup-plugin-visualizer';
import {loadEnv, type Plugin} from 'vite';
import {defineConfig} from 'vitest/config';
import checker from 'vite-plugin-checker';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const BUILD_INFO_ID = 'virtual:build-info';
const BUILD_INFO_RESOLVED = `\0${BUILD_INFO_ID}`;

const firebaseEnvKeys = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID',
  'REACT_APP_GOOGLE_OAUTH_CLIENT_ID',
] as const;

const jestCompatPlugin = (): Plugin => ({
  name: 'jest-to-vi-in-tests',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('node_modules') || !/\.test\.[tj]sx?$/.test(id)) {
      return null;
    }
    if (!/\bjest\./.test(code)) {
      return null;
    }
    return {
      code: code.replace(/\bjest\./g, 'vi.'),
      map: null,
    };
  },
});

const buildInfoPlugin = (): Plugin => ({
  name: 'virtual-build-info',
  resolveId(id) {
    if (id === BUILD_INFO_ID) {
      return BUILD_INFO_RESOLVED;
    }
    return undefined;
  },
  load(id) {
    if (id !== BUILD_INFO_RESOLVED) {
      return undefined;
    }
    const packageJson = JSON.parse(
      readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
    ) as {version?: string};
    const buildInfo = {
      version: packageJson.version || '1.0.0',
      buildTime: new Date().toISOString(),
      buildTimestamp: Date.now(),
    };
    return `export const buildInfo = ${JSON.stringify(buildInfo)};`;
  },
});

const manualChunk = (id: string, isDemo: boolean): string | undefined => {
  if (!id.includes('node_modules')) {
    return undefined;
  }
  if (id.includes('@mui') || id.includes('@emotion')) {
    return 'mui';
  }
  if (!isDemo && (id.includes('firebase') || id.includes('@firebase'))) {
    if (id.includes('firestore') && !id.includes('lite')) {
      return 'firestore-full';
    }
    return 'firebase';
  }
  if (
    id.includes('react-router') ||
    id.includes('/react-dom/') ||
    id.includes('/react/')
  ) {
    return 'react-vendor';
  }
  if (id.includes('@reduxjs') || id.includes('react-redux')) {
    return 'redux';
  }
  if (id.includes('recharts')) {
    return 'recharts';
  }
  return undefined;
};

const demoModuleAliases = (isDemo: boolean): Plugin => ({
  name: 'demo-module-aliases',
  enforce: 'pre',
  resolveId(source) {
    if (!isDemo) {
      return undefined;
    }
    if (source.endsWith('liveIndexedDbName')) {
      return path.resolve(rootDir, 'src/api/liveIndexedDbName.demo.ts');
    }
    if (source.endsWith('firebase/firebaseConfig') || source.endsWith('/firebaseConfig')) {
      return path.resolve(rootDir, 'src/firebase/firebaseConfig.demo.ts');
    }
    return undefined;
  },
});

const stripDemoFirebaseHosts = (mode: string): Plugin => ({
  name: 'strip-demo-firebase-hosts',
  transformIndexHtml(html) {
    if (mode !== 'demo') {
      return html;
    }
    return html
      .split('\n')
      .filter((line) => {
        if (!/rel="(?:preconnect|dns-prefetch)"/.test(line)) {
          return true;
        }
        return /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(line);
      })
      .join('\n');
  },
});

/**
 * `--mode e2e` (Playwright only): never reads .env, points the app at the local Firebase
 * emulators under the fake `demo-pennywise` project, and builds into build-e2e/.
 */
const E2E_FIREBASE_ENV: Record<string, string> = {
  REACT_APP_FIREBASE_API_KEY: 'demo-api-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'demo-pennywise.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'demo-pennywise',
  REACT_APP_FIREBASE_STORAGE_BUCKET: '',
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '',
  REACT_APP_FIREBASE_APP_ID: 'demo-app-id',
  REACT_APP_FIREBASE_MEASUREMENT_ID: '',
  REACT_APP_GOOGLE_OAUTH_CLIENT_ID: '',
};

export default defineConfig(({mode, command}) => {
  const isDemo = mode === 'demo';
  const isE2E = mode === 'e2e';
  const env: Record<string, string> = isDemo ? {} : isE2E ? E2E_FIREBASE_ENV : loadEnv(mode, rootDir, 'REACT_APP_');
  const processEnvDefines: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(
      command === 'build' ? 'production' : 'development',
    ),
    __DEMO_BUILD__: JSON.stringify(isDemo),
    __E2E_EMULATORS__: JSON.stringify(isE2E),
  };
  for (const key of firebaseEnvKeys) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(isDemo ? '' : (env[key] ?? ''));
  }

  return {
    envPrefix: 'REACT_APP_',
    // e2e must not pick up REACT_APP_* values from .env files through import.meta.env.
    envDir: isE2E ? path.join(rootDir, 'tests') : rootDir,
    define: processEnvDefines,
    plugins: [
      react(),
      jestCompatPlugin(),
      buildInfoPlugin(),
      demoModuleAliases(isDemo),
      stripDemoFirebaseHosts(mode),
      mode !== 'test' && !isE2E && checker({typescript: true}),
      command === 'build' && !isDemo && !isE2E && visualizer({
        filename: path.join(rootDir, 'build/bundle-analysis-report.html'),
        open: false,
        gzipSize: true,
      }),
    ],
    optimizeDeps: {
      include: ['antd', '@mui/material', '@emotion/react'],
    },
    server: {
      port: 3000,
      strictPort: true,
      host: '127.0.0.1',
      watch: {
        ignored: ['**/build/**', '**/functions/**', '**/infra/**'],
      },
    },
    preview: {
      port: isE2E ? 3100 : 3000,
      strictPort: true,
      host: '127.0.0.1',
    },
    build: {
      outDir: isE2E ? 'build-e2e' : 'build',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => manualChunk(id, isDemo),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/setupTests.ts',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      server: {
        deps: {
          inline: [/^firebase(?:\/|$)/, /^@firebase(?:\/|$)/],
        },
      },
    },
  };
});
