/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference


/**
 * Adds a new expense by calling the 'addExpenseData' cloud function.
 *
 * @param {object} expense - The expense object to be added.
 * @param {string} accessToken - The OAuth2 access token for authorization.
 * @returns {object|string|null} - The response from the cloud function.
 */
const addExpense = (expense, accessToken) => {
  return callCloudFunction('addExpenseData', expense, accessToken);
};


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
  };
  return callCloudFunction('setOneDoc', payload, accessToken);
};


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
  };
  return callCloudFunction('getOneDoc', payload, accessToken);
};


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
  };
  return callCloudFunction('getAllDoc', payload, accessToken);
};


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
};
