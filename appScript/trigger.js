/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
/// <reference path="functions.js" />
/* eslint-disable */
// noinspection JSUnresolvedReference
// noinspection SpellCheckingInspection
// noinspection JSUnusedGlobalSymbols
// noinspection JDuplicatedCode
// noinspection JSUnresolvedReference


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
