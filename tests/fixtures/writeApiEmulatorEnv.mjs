/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createHash} from 'node:crypto';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const MARKER = '# pennywise-e2e generated';
const TOKEN = 'e2e-api-token-0123456789abcdef0123456789abcdef';
const digest = createHash('sha256').update(TOKEN).digest('hex');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const secretPath = path.join(root, 'functions/.secret.local');
const envPath = path.join(root, 'functions/.env.demo-pennywise');

function writeGenerated(filePath, body) {
  if (existsSync(filePath)) {
    const current = readFileSync(filePath, 'utf8');
    if (!current.startsWith(MARKER)) {
      throw new Error(`Refusing to overwrite ${filePath} without marker ${MARKER}`);
    }
  }
  writeFileSync(filePath, `${MARKER}\n${body}`);
}

writeGenerated(secretPath, [
  `pennywise-api-token=${digest}`,
  'pennywise-api-token-next=disabled',
  'pennywise-oauth-client-secret=e2e-placeholder-oauth',
  'pennywise-gemini-api-key=e2e-placeholder-gemini',
  '',
].join('\n'));

writeGenerated(envPath, [
  'PENNYWISE_API_OWNER_EMAIL=api-owner@example.com',
  'GOOGLE_OAUTH_CLIENT_ID=e2e-placeholder',
  '',
].join('\n'));
