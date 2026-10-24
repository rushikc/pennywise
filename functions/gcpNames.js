/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const fs = require('fs');
const path = require('path');

function loadGcpNames() {
  const candidates = [
    path.join(__dirname, 'shared', 'gcpNames.json'),
    path.join(__dirname, '..', 'shared', 'gcpNames.json'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  throw new Error('shared/gcpNames.json not found');
}

function functionsServiceAccountEmail(projectId) {
  const names = loadGcpNames();
  return `${names.functionsServiceAccountId}@${projectId}.iam.gserviceaccount.com`;
}

module.exports = {
  loadGcpNames,
  functionsServiceAccountEmail,
};
