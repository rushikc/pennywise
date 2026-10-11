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
const cloudAddExpense = (expense, accessToken) => {
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


/**
 * Extracts the clean email address from a string that may contain a display name
 * (e.g., "HDFC Bank InstaAlerts <alerts@hdfcbank.net>").
 * @param {string} emailString The full email string from the header.
 * @returns {string} The clean email address.
 */
function extractEmailAddress(emailString) {
  if (!emailString) return '';
  const match = emailString.match(/<([^>]+)>/);
  if (match) {
    return match[1].trim();
  }
  return emailString.trim().toLowerCase();
}


/**
 * @param {*} res - Gmail Users.Messages resource
 * @returns {string}
 */
function getMailSubject(res) {
  if (!res || !res.payload || !res.payload.headers) {
    return '';
  }
  const headers = res.payload.headers;
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (h && String(h.name).toLowerCase() === 'subject') {
      return h.value != null ? String(h.value) : '';
    }
  }
  return '';
}

/**
 * Retrieves the sender and receiver email addresses from a Gmail Message object.
 * @param {*} res
 * @returns {object} An object containing the sender and receiver emails.
 */
function getMailSenderReceiver(res) {

  let sender = '';
  let receiver = '';

  if (res && res.payload && res.payload.headers) {
    let headers = res.payload.headers;

    for (let i = 0; i < headers.length; i++) {
      let header = headers[i];

      if (header.name === 'From') {
        sender = header.value;
      }

      if (header.name === 'To') {
        receiver = header.value;
      }

      if (sender && receiver) {
        break;
      }
    }
  }

  const senderEmail = extractEmailAddress(sender);
  const receiverEmail = extractEmailAddress(receiver);

  return {
    sender,
    receiver,
    senderEmail,
    receiverEmail
  };
}

/**
 * Extracts the username (the part before the '@') from a full email address.
 * For example: "RUSHI743@gmail.com" -> "RUSHI743"
 *
 * @param {string} emailAddress The full email address string.
 * @returns {string} The extracted username, or an empty string if the input is invalid.
 */
function extractUsername(emailAddress) {
  if (!emailAddress || typeof emailAddress !== 'string') {
    if (typeof Logger !== 'undefined') {
      Logger.log('Error: Invalid input provided to extractUsername.');
    }
    return '';
  }
  const atIndex = emailAddress.indexOf('@');
  if (atIndex !== -1) {
    return emailAddress.substring(0, atIndex).trim().toLowerCase();
  }
  return emailAddress.trim().toLowerCase();
}


/**
 * @param {*} o
 * @returns {boolean}
 */
function isValidExpenseGeminiShape(o) {
  if (o === null || o === undefined) {
    return false;
  }
  if (typeof o !== 'object' || Array.isArray(o)) {
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(o, 'cost') ||
      !Object.prototype.hasOwnProperty.call(o, 'costType') ||
      !Object.prototype.hasOwnProperty.call(o, 'vendor')) {
    console.warn('validateExpense: missing cost, costType, or vendor');
    return false;
  }

  const costNum = Number(o.cost);
  if (isNaN(costNum) || costNum <= 0) {
    console.warn('validateExpense: cost must be a positive number');
    return false;
  }

  const ct = String(o.costType).toLowerCase().trim();
  if (ct !== 'debit' && ct !== 'credit') {
    console.warn('validateExpense: costType must be debit or credit');
    return false;
  }

  const vendorStr = o.vendor === null || o.vendor === undefined ? '' : String(o.vendor).trim();
  if (!vendorStr) {
    console.warn('validateExpense: vendor must be a non-empty string');
    return false;
  }

  return true;
}

/**
 * @param {object} o
 * @returns {{cost: number, costType: string, vendor: string, type: string|null}}
 */
function normalizeGeminiExpense(o) {
  const rawType = o.type;
  const type =
    rawType != null && String(rawType).trim() !== ''
      ? String(rawType).toLowerCase().trim()
      : null;

  return {
    cost: Number(Number(o.cost).toFixed(2)),
    costType: String(o.costType).toLowerCase().trim(),
    vendor: String(o.vendor).trim(),
    type,
  };
}

/**
 * Returns displayName for the first bank whose matchStrings appear in text (case-insensitive).
 * @param {string} text
 * @param {Array<{displayName?: string, matchStrings?: string[]}>} banks
 * @returns {string|null}
 */
function findEmailParseBankMatch(text, banks) {
  if (!text || !banks || !banks.length) {
    return null;
  }
  const haystack = text.toUpperCase();
  for (let i = 0; i < banks.length; i++) {
    const entry = banks[i];
    const phrases = entry.matchStrings || [];
    const display = entry.displayName || '';
    for (let j = 0; j < phrases.length; j++) {
      const p = String(phrases[j]).trim().toUpperCase();
      if (p && haystack.indexOf(p) !== -1) {
        return display || 'Bank';
      }
    }
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractEmailAddress: extractEmailAddress,
    getMailSubject: getMailSubject,
    getMailSenderReceiver: getMailSenderReceiver,
    extractUsername: extractUsername,
    isValidExpenseGeminiShape: isValidExpenseGeminiShape,
    normalizeGeminiExpense: normalizeGeminiExpense,
    findEmailParseBankMatch: findEmailParseBankMatch,
  };
}
