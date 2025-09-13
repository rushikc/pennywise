/*
 * Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details, or get a copy at
 * <https://www.gnu.org/licenses/gpl-3.0.txt>.
 */

/// <reference path="functions.js" />
/* eslint-disable */
// noinspection JSUnresolvedReference
// noinspection SpellCheckingInspection
// noinspection JSUnusedGlobalSymbols
// noinspection JDuplicatedCode
// noinspection JSUnresolvedReference


/**
 * Applies regex patterns to a string and returns the first valid match
 *
 * @param {string} snippet - The text to apply regex patterns to
 * @param {string[]} regexPatterns - Array of regex patterns to try
 * @param {function} validationFn - Function to validate the match
 * @returns {string|null} - The first valid match or null if no match found
 */
function applyRegexPatterns(snippet, regexPatterns, validationFn) {
    for (const pattern of regexPatterns) {
        try {
            const match = snippet.match(new RegExp(pattern));
            if (match && match[1]) {
                const result = match[1];
                if (validationFn(result)) {
                    return result;
                }
            }
        } catch (regexError) {
            console.log(`-> Regex failed: ${pattern}`, regexError.message);
        }
    }
    return null;
}

/**
 * Extracts cost information from an email snippet using regex patterns
 *
 * @param {string} snippet - The email snippet to extract cost from
 * @param {string[]} costRegexPatterns - Array of regex patterns to try
 * @returns {string|null} - The extracted cost as a string, or null if not found
 */
function extractCostFromSnippet(snippet, costRegexPatterns) {
    return applyRegexPatterns(snippet, costRegexPatterns, (match) => {
        const parsedCost = Number(match);
        return !isNaN(parsedCost) && parsedCost > 0;
    });
}

/**
 * Extracts vendor information from an email snippet using regex patterns
 *
 * @param {string} snippet - The email snippet to extract vendor from
 * @param {string[]} vendorRegexPatterns - Array of regex patterns to try
 * @returns {string|null} - The extracted vendor as a string, or null if not found
 */
function extractVendorFromSnippet(snippet, vendorRegexPatterns) {
    return applyRegexPatterns(snippet, vendorRegexPatterns, (match) => {
        return match && match.trim() !== '';
    });
}


/**
 * Processes Gmail messages to extract expense data and store it in a database.
 */
async function myExpenseFunction() {

    const Config = 'config';
    const LastGmailId = 'lastGmailId';
    const VendorTag = 'vendorTag';

    // usually returns last 100 mails
    let res = Gmail.Users.Messages.list('me');
    let mailIdList = res.messages.map((res) => res.id);

    const accessToken = ScriptApp.getOAuthToken();

    // console.log(mailIdList);

    const vendorTag = getAllDoc(VendorTag, accessToken);


    let lastMailId;

    mailIdList = mailIdList.reverse();

    let res_doc = getOneDoc(Config, LastGmailId, accessToken);
    let mailId;

    if (res_doc) {
        mailId = res_doc.value;
    } else {
        mailId = '';
    }

    console.log('Last mail id ', mailId);

    let lastMailIdIndex = mailIdList.indexOf(mailId);
    // mailIdList = mailIdList.slice(70);
    mailIdList = mailIdList.slice(lastMailIdIndex + 1);
    console.log('Pending mail id list ', mailIdList);
    console.log('Pending mail id length', mailIdList.length);
    // return;

    const emailParsingConfig = JSON.parse(UrlFetchApp.fetch(
        'https://raw.githubusercontent.com/rushikc/pennywise/main/appScript/emailParsingConfig.json'
    ).getContentText());


    for (const mailIndex in mailIdList) {
        let mailId = mailIdList[mailIndex];
        res = Gmail.Users.Messages.get('me', mailId);

        let snippet = res.snippet;

        console.log('Email snippet ', snippet);

        for (const hdfcIndex in emailParsingConfig.v1.config) {
            const config = emailParsingConfig.v1.config[hdfcIndex];

            let expense = null;
            let type = '';
            let cost;
            let vendor;

            let subStringFound = true;
            for (const subString of config.snippetStrings) {
                if (!snippet.includes(subString)) {
                    subStringFound = false;
                    break;
                }
            }

            if (subStringFound) {
                type = config.type;
                try {
                    console.log('-> Matched config strings: ', config.snippetStrings);

                    // Extract the full email body instead of using the snippet for extraction
                    const fullEmailBody = findBody(res.payload.parts);
                    let textToExtractFrom = snippet; // Default to snippet if body extraction fails

                    if (fullEmailBody) {
                        // If the email body is HTML, extract its plain text content
                        if (res.payload.mimeType === 'text/html' ||
                            (res.payload.parts && res.payload.parts.some(p => p.mimeType === 'text/html'))) {
                            textToExtractFrom = extractPlainTextFromHtml(fullEmailBody);
                        } else {
                            textToExtractFrom = fullEmailBody;
                        }
                        console.log('-> Using full email body for extraction');
                    } else {
                        console.log('-> Could not extract full email body, falling back to snippet');
                    }

                    console.log('-> Extracted text: ', textToExtractFrom.substring(0, 300));

                    // Extract cost using the full email body
                    cost = extractCostFromSnippet(textToExtractFrom, config.costRegex);

                    // Extract vendor using the full email body
                    vendor = extractVendorFromSnippet(textToExtractFrom, config.vendorRegex);

                    console.log('-> Extracted cost: ', cost);
                    console.log('-> Extracted vendor: ', vendor);


                    // Only proceed if both cost and vendor were successfully extracted
                    if (cost !== null && vendor !== null) {
                        expense = getExpense(Number(res.internalDate), config.type, mailId);
                        expense.costType = config.costType;

                        expense.cost = Number(cost);
                        expense.vendor = vendor.toUpperCase().substring(0, 50);

                        const obj = vendorTag.find(({vendor}) => expense.vendor === vendor);

                        if (obj) {
                            expense.tag = obj.tag;
                        }

                        await addExpense(expense, accessToken);

                        console.log('-> ', type.toUpperCase(), ' cost: ', expense.cost);
                        console.log('-> ', type.toUpperCase(), ' vendor: ', expense.vendor);
                        console.log('-> ', type.toUpperCase(), ' expense: ', expense);
                    } else {
                        console.log('-> Failed to extract valid cost or vendor from snippet');
                    }

                } catch (e) {
                    console.error('Error parsing snippet with config: ', config, e);
                }
                break; // Exit the loop after the first matching config
            }


        }


        lastMailId = mailId;

    }


    if (lastMailId) {
        console.log('Post execution last mail id ', lastMailId);
        setOneDoc('config', 'lastGmailId', lastMailId, accessToken);
    }


}


/**
 * Creates an expense object with default values.
 */
const getExpense = (date, type, mailId) => {
    return {
        cost: 0, costType: 'debit', vendor: null, tag: null, type, date, modifiedDate: date, user: 'xyz', mailId
    };
};


/**
 * Handles GET requests to the web app.
 * This function is triggered when the web app accesses AppScript.
 */
function doGet() {
    Logger.log('doGet function called.');
    myExpenseFunction().then(() => Logger.log('executed expense function'));

    // Return a ContentService response with the email and a 200 OK status
    return ContentService.createTextOutput('Started function')
        .setMimeType(ContentService.MimeType.TEXT);
}
