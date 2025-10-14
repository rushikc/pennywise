#!/usr/bin/env node

/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/
//eslint-disable-next-line node/no-missing-require
const fs = require('fs');
//eslint-disable-next-line node/no-missing-require
const path = require('path');

// Get the current timestamp
const buildTime = new Date().toISOString();

// Read package.json to get version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create build info object
const buildInfo = {
  version: packageJson.version || '1.0.0',
  buildTime: buildTime,
  buildTimestamp: Date.now()
};

// Create the build info file
const buildInfoPath = path.join(__dirname, '..', 'src', 'buildInfo.ts');
const buildInfoContent = `/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

// This file is auto-generated during build process
// Do not edit manually

export interface BuildInfo {
  version: string;
  buildTime: string;
  buildTimestamp: number;
}

export const buildInfo: BuildInfo = ${JSON.stringify(buildInfo, null, 2).replace(/"/g, "'")};

export const getBuildInfo = (): BuildInfo => buildInfo;

export const getFormattedBuildTime = (): string => {
  const date = new Date(buildInfo.buildTime);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
`;

// Write the build info file
fs.writeFileSync(buildInfoPath, buildInfoContent);

console.log('Build info generated successfully!');
console.log('Version:', buildInfo.version);
