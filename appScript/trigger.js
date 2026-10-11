/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference

/**
 * Creates a time-driven trigger to run 'mainFunction' every hour.
 * Run this function once manually or via `clasp run createHourlyTrigger`.
 */
function createTrigger() {
  // Delete existing triggers for mainFunction to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'myExpenseFunction') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create a new time-driven trigger
  ScriptApp.newTrigger('myExpenseFunction')
    .timeBased()
    .everyHours(1) // Runs every hour
    .create();

  Logger.log('Hourly trigger for \'myExpenseFunction\' created.');

}

/**
 * Creates a daily time-driven trigger to run duplicate detection at 03:00 IST.
 * Run once manually or via clasp run createDedupeTrigger.
 */
function createDedupeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'myDedupeFunction') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('myDedupeFunction')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  Logger.log('Daily trigger for \'myDedupeFunction\' created at 03:00.');
}
