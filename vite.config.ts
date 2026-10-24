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

const manualChunk = (id: string): string | undefined => {
  if (!id.includes('node_modules')) {
    return undefined;
  }
  if (id.includes('@mui') || id.includes('@emotion')) {
    return 'mui';
  }
  if (id.includes('firebase') || id.includes('@firebase')) {
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

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, rootDir, 'REACT_APP_');
  const processEnvDefines: Record<string, string> = {
    'process.env.NODE_ENV': JSON.stringify(
      mode === 'production' ? 'production' : 'development',
    ),
  };
  for (const key of firebaseEnvKeys) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(env[key] ?? '');
  }

  return {
    envPrefix: 'REACT_APP_',
    define: processEnvDefines,
    plugins: [
      react(),
      jestCompatPlugin(),
      buildInfoPlugin(),
      mode !== 'test' && checker({typescript: true}),
      mode === 'production' && visualizer({
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
        ignored: ['**/build/**', '**/functions/**', '**/appScript/**'],
      },
    },
    preview: {
      port: 3000,
      host: '127.0.0.1',
    },
    build: {
      outDir: 'build',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: manualChunk,
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
