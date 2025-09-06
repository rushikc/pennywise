/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
 * Adds a new expense by calling the 'addExpenseData' cloud function.
 *
 * @param {object} expense - The expense object to be added.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The response from the cloud function.
 */
const addExpense = (expense, accessToken) => {
    return callCloudFunction('addExpenseData', expense, accessToken);
}


/**
 * Sets a single document in a Firestore collection by calling the 'setOneDoc' cloud function.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} key - The document key.
 * @param {*} value - The value to be set in the document.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The response from the cloud function.
 */
const setOneDoc = (collection, key, value, accessToken) => {
    const payload = {
        key,
        collection,
        json: {value}
    }
    return callCloudFunction('setOneDoc', payload, accessToken);
}


/**
 * Retrieves a single document from a Firestore collection by calling the 'getOneDoc' cloud function.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} key - The document key.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The response from the cloud function.
 */
const getOneDoc = (collection, key, accessToken) => {
    const payload = {
        key,
        collection
    }
    return callCloudFunction('getOneDoc', payload, accessToken);
}


/**
 * Retrieves all documents from a Firestore collection by calling the 'getAllDoc' cloud function.
 *
 * @param {string} collection - The name of the Firestore collection.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The response from the cloud function.
 */
const getAllDoc = (collection, accessToken) => {
    const payload = {
        collection
    }
    return callCloudFunction('getAllDoc', payload, accessToken);
}


/**
 * Calls a Google Cloud Function by name with a given payload and access token.
 *
 * @param {string} functionName - The name of the Cloud Function to call.
 * @param {object} payload - The JSON payload to send to the function.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The parsed JSON response, the raw content, or null if no content.
 */
const callCloudFunction = (functionName, payload, accessToken) => {
    const url = `https://${PROJECT_REGION}-${PROJECT_ID}.cloudfunctions.net/${functionName}`;

    const options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
    };

    if (accessToken) {
        options.headers = {
            'Authorization': 'Bearer ' + accessToken
        };
    }

    const resp = UrlFetchApp.fetch(url, options);
    const content = resp.getContentText();

    if (content) {
        try {
            return JSON.parse(content);
        } catch (e) {
            return content;
        }
    }
    return null;
}
