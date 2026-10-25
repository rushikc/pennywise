#!/usr/bin/env node
/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');
const BUILD_DIR = path.join(ROOT, 'build');
const TEXT_EXT = new Set(['.js', '.css', '.html', '.json', '.txt', '.map', '.svg']);

const REAL_UPI = /@(ybl|ptybl|ptys|pty|paytm|okaxis|okhdfcbank|okicici|oksbi|ibl|axl|upi)\b/i;

const RULES = [
  {name: 'firebaseapp.com', pattern: /firebaseapp\.com/i, hard: true},
  {name: 'firebasestorage.app', pattern: /firebasestorage\.app/i, hard: true},
  {name: 'AIza', pattern: /AIza/, hard: true},
  {name: 'identitytoolkit.googleapis.com', pattern: /identitytoolkit\.googleapis\.com/i, hard: true},
  {name: 'firestore.googleapis.com', pattern: /firestore\.googleapis\.com/i, hard: true},
  {name: 'accounts.google.com/gsi', pattern: /accounts\.google\.com\/gsi/i, hard: true},
  {name: 'real-upi', pattern: REAL_UPI, hard: true},
];

const listFiles = (dir, files = []) => {
  if (!fs.existsSync(dir)) {
    return files;
  }
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, files);
    } else if (TEXT_EXT.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
};

const personalProjectId = process.env.PERSONAL_FIREBASE_PROJECT_ID;
if (personalProjectId) {
  RULES.push({
    name: 'personal-project-id',
    pattern: new RegExp(personalProjectId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    hard: true,
  });
}

if (!fs.existsSync(BUILD_DIR)) {
  console.error('verify:demo-bundle: build/ is missing. Run npm run build:demo first.');
  process.exit(1);
}

if (fs.existsSync(path.join(BUILD_DIR, 'bundle-analysis-report.html'))) {
  console.error('verify:demo-bundle: bundle-analysis-report.html must not be in a demo build.');
  process.exit(1);
}

const files = listFiles(BUILD_DIR);
let failed = false;
const warnings = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const relative = path.relative(ROOT, file);
  for (const rule of RULES) {
    if (!rule.pattern.test(text)) {
      continue;
    }
    if (rule.hard) {
      console.error(`${relative}: ${rule.name}`);
      failed = true;
    } else {
      warnings.push(`${relative}: ${rule.name}`);
    }
  }
}

for (const warning of warnings) {
  console.warn(warning);
}

if (failed) {
  process.exit(1);
}

console.log(`verify:demo-bundle: ok (${files.length} files)`);
