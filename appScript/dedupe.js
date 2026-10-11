/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference

/**
 * Daily duplicate-expense detection job.
 * Calls the dedupeExpenses Cloud Function with a 7-day trailing window.
 */
function myDedupeFunction() {
  const accessToken = ScriptApp.getOAuthToken();
  const payload = {
    days: 7,
    dryRun: false,
  };

  console.log('myDedupeFunction: starting dedupeExpenses', JSON.stringify(payload));
  const result = callCloudFunction('dedupeExpenses', payload, accessToken);
  console.log('myDedupeFunction: result', JSON.stringify(result));
}
