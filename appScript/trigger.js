/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/


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
