#!/usr/bin/env node

/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

const fs = require('fs');
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
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

// This file is auto-generated during build process
// Do not edit manually

export interface BuildInfo {
  version: string;
  buildTime: string;
  buildTimestamp: number;
}

export const buildInfo: BuildInfo = ${JSON.stringify(buildInfo, null, 2)};

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
console.log('Build Time:', buildInfo.buildTime);
