/*
Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

// noinspection JSUnresolvedReference,SpellCheckingInspection,JSUnusedGlobalSymbols,DuplicatedCode


async function tagExpenses() {
    const Config = "config";
    const LastAccessedTime = "lastTaggedTime";
    const VendorTag = "vendorTag";
    const Expenses = "expenses";

    let lastTaggedTimeDoc = getOneDoc(Config, LastAccessedTime);
    let lastTaggedTime = 0;

    if (lastTaggedTimeDoc) {
        lastTaggedTime = lastTaggedTimeDoc.value;
        console.log("Last tagged time: ", new Date(lastTaggedTime).toLocaleString());
    } else {
        lastTaggedTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
        console.log("No last tagged time found. Using default: ", new Date(lastTaggedTime).toLocaleString());
    }

    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/getExpensesSinceDate";
    const data = {
        timestamp: lastTaggedTime
    };

    const options = {
        "method": "post",
        "headers": {"Content-Type": "application/json"},
        "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    const expenses = JSON.parse(resp.getContentText());

    console.log("Found " + expenses.length + " expenses to process");

    const vendorTag = getAllDoc(VendorTag);
    console.log("Loaded " + vendorTag.length + " tag mappings");

    let updatedCount = 0;
    for (const expense of expenses) {
        if (!expense.tag && expense.vendor) {
            const vendorUpper = expense.vendor.toUpperCase();
            const matchingTag = vendorTag.find(mapping => vendorUpper.includes(mapping.vendor.toUpperCase()));

            if (matchingTag) {
                expense.tag = matchingTag.tag;
                await addExpense(expense);
                updatedCount++;
                console.log(`Tagged "${expense.vendor}" with "${matchingTag.tag}"`);
            }
        }
    }

    console.log(`Tagged ${updatedCount} out of ${expenses.length} expenses`);

    const currentTime = Date.now();
    setOneDoc(Config, LastAccessedTime, currentTime);
    console.log("Updated last tagged time to: " + new Date(currentTime).toLocaleString());
}


const addExpense = async (expense) => {

    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/addExpenseData";

    const options = {
        "method": "post",
        "headers": {"Content-Type": "application/json"},
        "payload": JSON.stringify(expense)
    };

    UrlFetchApp.fetch(url, options);

}


const setOneDoc = (collection, key, value) => {
    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/setOneDoc";

    const data = {
        key,
        collection,
        json: { value }
    }

    const options = {
        "method": "post",
        "headers": {"Content-Type": "application/json"},
        "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    return resp.getContentText();
}



const getOneDoc = (collection, key) => {
    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/getOneDoc";

    const data = {
        key,
        collection
    }

    const options = {
        "method": "post",
        "headers": {"Content-Type": "application/json"},
        "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    return resp.getContentText() ? JSON.parse(resp.getContentText()) : null;
}



const getAllDoc = (collection) => {
    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/getAllDoc";

    const data = {
        collection
    }

    const options = {
        "method": "post",
        "headers": {"Content-Type": "application/json"},
        "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    return resp.getContentText() ? JSON.parse(resp.getContentText()) : null;
}

