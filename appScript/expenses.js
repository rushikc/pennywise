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
 * Processes Gmail messages to extract expense data and store it in a database.
 */
async function myExpenseFunction() {

    const Config = "config";
    const LastGmailId = "lastGmailId";
    const VendorTag = "vendorTag";

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
        mailId = "";
    }

    console.log("Last mail id ", mailId);

    let lastMailIdIndex = mailIdList.indexOf(mailId);
    mailIdList = mailIdList.slice(lastMailIdIndex + 1);
    console.log("Pending mail id list ", mailIdList);
    console.log("Pending mail id length", mailIdList.length);
    // return;

    const emailParsingConfig = JSON.parse(UrlFetchApp.fetch(
        'https://raw.githubusercontent.com/rushikc/pennywise/main/appScript/emailParsingConfig.json'
    ).getContentText());


    for (const mailIndex in mailIdList) {
        let mailId = mailIdList[mailIndex];
        res = Gmail.Users.Messages.get('me', mailId);

        let snippet = res.snippet;


        console.log("Email snippet ", snippet);

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

                    // Iterate through costRegex array until a valid number is found
                    cost = null;
                    for (const costRegexPattern of config.costRegex) {
                        try {
                            const costMatch = snippet.match(new RegExp(costRegexPattern));
                            if (costMatch && costMatch[1]) {
                                const parsedCost = Number(costMatch[1]);
                                if (!isNaN(parsedCost) && parsedCost > 0) {
                                    cost = costMatch[1];
                                    break;
                                }
                            }
                        } catch (regexError) {
                            console.log('-> Cost regex failed:', costRegexPattern, regexError.message);
                        }
                    }

                    // Iterate through vendorRegex array until a non-null match is found
                    vendor = null;
                    for (const vendorRegexPattern of config.vendorRegex) {
                        try {
                            const vendorMatch = snippet.match(new RegExp(vendorRegexPattern));
                            if (vendorMatch && vendorMatch[1] && vendorMatch[1].trim()) {
                                vendor = vendorMatch[1];
                                break;
                            }
                        } catch (regexError) {
                            console.log('-> Vendor regex failed:', vendorRegexPattern, regexError.message);
                        }
                    }

                    // Only proceed if both cost and vendor were successfully extracted
                    if (cost !== null && vendor !== null) {
                        expense = getExpense(Number(res.internalDate), config.type, mailId);
                        expense.costType = config.costType;

                        console.log('-> Cost: ', cost);
                        console.log('-> Vendor: ', vendor);

                        expense.cost = Number(cost)
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
        setOneDoc("config", "lastGmailId", lastMailId, accessToken);
    }


}


/**
 * Creates an expense object with default values.
 */
const getExpense = (date, type, mailId) => {
    return {
        cost: 0, costType: 'debit', vendor: null, tag: null, type, date, modifiedDate: date, user: 'xyz', mailId
    };
}


/**
 * Handles GET requests to the web app.
 * This function is triggered when the web app accesses AppScript.
 */
function doGet() {
    Logger.log("doGet function called.");
    myExpenseFunction().then(() => Logger.log("executed expense function"));

    // Return a ContentService response with the email and a 200 OK status
    return ContentService.createTextOutput("Started function")
        .setMimeType(ContentService.MimeType.TEXT);
}