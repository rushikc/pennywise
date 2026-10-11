/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */
// noinspection JSUnusedGlobalSymbols
// noinspection JSUnresolvedReference

/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */

async function myExpenseFunction() {
  const now = new Date();
  const istHour = parseInt(Utilities.formatDate(now, 'Asia/Kolkata', 'H'), 10);
  if (isOutsideExpenseWindow(istHour)) {
    console.log('myExpenseFunction: skipped — outside IST window 09:00–22:00. IST');
    return;
  }

  const Config = 'config';
  const LastGmailId = 'lastGmailId';
  const VendorTag = 'vendorTag';

  // 1. CHECK API KEY
  if (!GEMINI_API_KEY) {
    console.error('CRITICAL ERROR: GEMINI_API_KEY is not set in Script Properties!');
    return;
  }

  let res = Gmail.Users.Messages.list('me');
  let mailIdList = res.messages.map((res) => res.id);
  const accessToken = ScriptApp.getOAuthToken();

  let lastMailId;
  mailIdList = mailIdList.reverse();

  let res_doc = getOneDoc(Config, LastGmailId, accessToken);
  let mailId = res_doc ? res_doc.value : '';

  const bankParseDoc = getOneDoc(Config, 'emailParseBanks', accessToken);
  const emailParseBanks = (bankParseDoc && bankParseDoc.banks) ? bankParseDoc.banks : [];

  const vendorTagRaw = getAllDoc(VendorTag, accessToken);
  const vendorTagList = Array.isArray(vendorTagRaw) ? vendorTagRaw : [];

  let lastMailIdIndex = mailIdList.indexOf(mailId);
  mailIdList = mailIdList.slice(90); // For testing: process last 30 mails
  // mailIdList = mailIdList.slice(lastMailIdIndex + 1);
  console.log('Pending mail id list ', mailIdList);
  console.log('Pending mail id length', mailIdList.length);


  for (const mailIndex in mailIdList) {
    let currentMailId = mailIdList[mailIndex];
    res = Gmail.Users.Messages.get('me', currentMailId);

    let textToExtractFrom = res.snippet; 
    let rawContent = '';

    if (res.payload.parts && res.payload.parts.length > 0) {
      rawContent = findBody(res.payload.parts);
    } else if (res.payload.body && res.payload.body.data) {
      rawContent = base64Decode(res.payload.body.data);
    }

    if (rawContent) {
      textToExtractFrom = extractPlainTextFromHtml(rawContent);
    }

    const matchedBankDisplayName = findEmailParseBankMatch(textToExtractFrom, emailParseBanks);
    console.log("Sender ", getMailSenderReceiver(res).senderEmail);
    
    if (matchedBankDisplayName) {

      console.log('-> ' + matchedBankDisplayName + ' detected valid bank. Sending to Gemini ...');

      const emailSubject = getMailSubject(res);
      const geminiResponse = callGemini(textToExtractFrom, emailSubject, GEMINI_API_KEY);
      const validatedExpense = validateExpense(geminiResponse, textToExtractFrom, emailSubject, GEMINI_API_KEY);

      if (validatedExpense) {
        console.log('-> Validated expense:', JSON.stringify(validatedExpense));
        addExpense(res, currentMailId, validatedExpense, accessToken, vendorTagList);
      } else {
        console.log('-> No valid expense after Gemini + validation (or not an expense).');
        console.log('Snippet ', textToExtractFrom);
      }
    } else {
      console.log('-> No configured bank match, skipping LLM.');
    }

    lastMailId = currentMailId;
  }

  if (lastMailId) {
    setOneDoc('config', 'lastGmailId', lastMailId, accessToken);
  }
}

/**
 * Validates Gemini JSON for a single expense. Logs each candidate object.
 * Retries callGemini once if the first body fails sanity checks.
 *
 * @param {*} geminiBody - First Gemini parse result (may be null if not an expense).
 * @param {string} emailText - Original email text for a single retry.
 * @param {string} emailSubject - Email subject line (passed to Gemini on retry).
 * @param {string} apiKey - Gemini API key.
 * @returns {{cost: number, costType: string, vendor: string}|null}
 */
function isOutsideExpenseWindow(istHour) {
  return istHour < 9 || istHour > 22;
}

function canonicalizeVendor(vendor) {
  let value = String(vendor).trim();
  const upiPattern = /^([^\s@]+@[^\s@]+)\s+(.+)$/;
  const upiMatch = value.match(upiPattern);

  if (upiMatch && upiMatch[1].trim().length !== 0 && upiMatch[2].trim().length !== 0) {
    value = `${upiMatch[2].trim()} ${upiMatch[1].trim()}`;
  }

  return value.toUpperCase().substring(0, 100);
}

function resolveVendorTag(canonicalVendor, vendorTagList) {
  const tagList = Array.isArray(vendorTagList) ? vendorTagList : [];
  const tagObj = tagList.find(function (entry) {
    if (!entry || entry.vendor == null) {
      return false;
    }
    return canonicalVendor === String(entry.vendor).trim().toUpperCase().substring(0, 100);
  });
  return tagObj ? tagObj.tag : undefined;
}

function mailDateFromMessage(gmailMessage, nowMs) {
  const now = nowMs == null ? Date.now() : nowMs;
  if (gmailMessage && gmailMessage.internalDate !== undefined && gmailMessage.internalDate !== null) {
    const mailDate = Number(gmailMessage.internalDate);
    if (!isNaN(mailDate)) {
      return mailDate;
    }
  }
  return now;
}

function validateExpense(geminiBody, emailText, emailSubject, apiKey, geminiCaller) {
  if (geminiBody === null) {
    return null;
  }

  if (isValidExpenseGeminiShape(geminiBody)) {
    return normalizeGeminiExpense(geminiBody);
  }

  console.warn('-> validateExpense: invalid shape; retrying callGemini once');
  const retry = geminiCaller || callGemini;
  const second = retry(emailText, emailSubject, apiKey);

  if (second === null) {
    return null;
  }

  if (isValidExpenseGeminiShape(second)) {
    return normalizeGeminiExpense(second);
  }

  console.error('-> validateExpense: still invalid after retry ', JSON.stringify(second));
  return null;
}

/**
 * Merges getExpense() with validated Gemini fields and persists via cloudAddExpense.
 *
 * @param {object} gmailMessage - Gmail Users.Messages resource (for date + user).
 * @param {string} mailId - Gmail message id (mailId in app).
 * @param {{cost: number, costType: string, vendor: string, type?: string}} validatedGemini
 * @param {string} accessToken - OAuth token for cloud function.
 * @param {Array<{vendor?: string, tag?: string}>} vendorTagList - Firestore vendorTag docs for tagging.
 */
function addExpense(gmailMessage, mailId, validatedGemini, accessToken, vendorTagList) {
  const cost = validatedGemini.cost;
  let vendor = validatedGemini.vendor == null ? null : String(validatedGemini.vendor).trim();

  if (cost == null || vendor === null || vendor === '') {
    console.log('-> Failed to extract valid cost or vendor from snippet');
    return;
  }

  const mailDate = mailDateFromMessage(gmailMessage);
  const expense = getExpense(mailDate, mailId);
  expense.costType = validatedGemini.costType;
  expense.cost = Number(cost);
  expense.vendor = canonicalizeVendor(vendor);
  expense.user = extractUsername(getMailSenderReceiver(gmailMessage).receiverEmail);

  const resolvedTag = resolveVendorTag(expense.vendor, vendorTagList);
  if (resolvedTag) {
    expense.tag = resolvedTag;
  }

  expense.type = validatedGemini.type;
  expense.operation = 'add';

  cloudAddExpense(expense, accessToken);

  const typeLabel = (validatedGemini.type && String(validatedGemini.type)) || 'expense';
  console.log('-> ', typeLabel.toUpperCase(), ' cost: ', expense.cost);
  console.log('-> ', typeLabel.toUpperCase(), ' vendor: ', expense.vendor);
  console.log('-> ', typeLabel.toUpperCase(), ' expense: ', expense);
}

/**
 * Corrected naming for Google's REST API (camelCase)
 */
function callGemini(text, subject, apiKey) {
  // 1. Switch to v1beta for better support with preview models
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const prompt = `Analyze this email and return a JSON object.
    Keys: "cost" (number), "costType" ("debit" or "credit"), "vendor" (name or UPI ID), "type" (upi, credit-card, e-mandate etc.).
    Note: usually if it's upi, you will see upi id like abc@ybl, xyz@paytm, etc
    Note: if it's credit card, you see text like "Credit Card ending 1234"
    
    IMPORTANT: If it is not an expense or transaction mail from bank, return null.
    
    Email Subject: ${subject}
    Email: ${text}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    // 2. Use snake_case keys for the REST API
    generation_config: {
      response_mime_type: "application/json"
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true 
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode !== 200) {
      console.error(`Gemini API Error (Status ${statusCode}): ${responseText}`);
      return null;
    }

    const json = JSON.parse(responseText);
    
    // Check if the response contains the expected text
    if (json.candidates && json.candidates[0].content && json.candidates[0].content.parts[0].text) {
      const resultText = json.candidates[0].content.parts[0].text;
      return JSON.parse(resultText);
    }
  } catch (e) {
    console.error('Error parsing Gemini response:', e.toString());
  }
  return null;
}

/**
 * Creates an expense object with default values.
 */
const getExpense = (date, mailId) => {
  return {
    cost: 0,
    costType: null,
    vendor: null,
    tag: null,
    type: null,
    date,
    modifiedDate: Date.now(),
    mailId,

  };
};


/**
 * Handles GET requests to the web app.
 * This function is triggered when the web app accesses AppScript.
 */
// function doGet() {
//   Logger.log('doGet function called.');
//   myExpenseFunction().then(() => Logger.log('executed expense function'));
//
//   // Return a ContentService response with the email and a 200 OK status
//   return ContentService.createTextOutput('Started function')
//     .setMimeType(ContentService.MimeType.TEXT);
// }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isOutsideExpenseWindow: isOutsideExpenseWindow,
    canonicalizeVendor: canonicalizeVendor,
    resolveVendorTag: resolveVendorTag,
    mailDateFromMessage: mailDateFromMessage,
    validateExpense: validateExpense,
  };
}
