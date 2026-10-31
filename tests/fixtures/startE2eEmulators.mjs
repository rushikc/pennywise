/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const TOKEN = 'e2e-api-token-0123456789abcdef0123456789abcdef';
const digest = createHash('sha256').update(TOKEN).digest('hex');

const child = spawn(
  'npx',
  ['firebase', 'emulators:start', '--only', 'firestore,auth,functions', '--project', 'demo-pennywise'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      'pennywise-api-token': digest,
      'pennywise-api-token-next': 'disabled',
      'pennywise-oauth-client-secret': 'e2e-placeholder-oauth',
      'pennywise-gemini-api-key': 'e2e-placeholder-gemini',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
