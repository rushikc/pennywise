#!/usr/bin/env node
/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

const ALLOW = new Set([
  '.env',
  'functions/.env',
  '.firebaserc',
  'infra/terraform/backend.hcl',
  'infra/terraform/terraform.tfvars',
]);

const ROOT_PREFIXES = [
  'src/',
  'functions/',
  'scripts/',
  'tests/',
  'docs/',
  'infra/',
  'shared/',
  'public/',
  '.github/',
  '.cursor/',
];

function gitFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], {cwd: ROOT, encoding: 'utf8'});
  return out.split('\0').filter((file) => file.endsWith('.md') || file.endsWith('.mdc'));
}

function stripFragment(target) {
  const hash = target.indexOf('#');
  return hash === -1 ? target : target.slice(0, hash);
}

function stripTitle(target) {
  const trimmed = target.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.slice(1, -1).trim();
  }
  const quoted = trimmed.match(/^(\S+)\s+["'].*["']$/);
  return quoted ? quoted[1] : trimmed;
}

function isSkippedUrl(target) {
  return /^(https?:|mailto:)/i.test(target) || target.startsWith('#') || target === '';
}

function repoRelative(fromFile, target) {
  const abs = path.resolve(path.dirname(path.join(ROOT, fromFile)), target);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return rel.split(path.sep).join('/');
}

function exists(rel) {
  if (ALLOW.has(rel)) {
    return true;
  }
  return fs.existsSync(path.join(ROOT, rel));
}

function collectTargets(text) {
  const found = [];
  const link = /(?:!\[[^\]]*\]|\[[^\]]*\])\(([^)]+)\)|(?:src|href)\s*=\s*["']([^"']+)["']/g;
  let match = link.exec(text);
  while (match) {
    const raw = stripTitle(match[1] || match[2] || '');
    const target = stripFragment(raw).trim();
    if (!isSkippedUrl(target)) {
      found.push({index: match.index, target, kind: 'link'});
    }
    match = link.exec(text);
  }

  const code = /`([^`\n]+)`/g;
  match = code.exec(text);
  while (match) {
    const token = match[1].trim().split(/\s+/)[0];
    const target = stripFragment(token);
    if (target.includes('*') || isSkippedUrl(target)) {
      match = code.exec(text);
      continue;
    }
    if (ROOT_PREFIXES.some((prefix) => target.startsWith(prefix) || target === prefix.slice(0, -1))) {
      found.push({index: match.index, target, kind: 'path'});
    }
    match = code.exec(text);
  }
  return found;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function main() {
  const failures = [];
  for (const file of gitFiles()) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const item of collectTargets(text)) {
      const rel = item.kind === 'path'
        ? item.target.replace(/^\.\//, '')
        : repoRelative(file, item.target);
      if (rel == null) {
        failures.push(`${file}:${lineOf(text, item.index)} -> ${item.target}`);
        continue;
      }
      if (!exists(rel)) {
        failures.push(`${file}:${lineOf(text, item.index)} -> ${item.target}`);
      }
    }
  }
  if (failures.length) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
}

main();
