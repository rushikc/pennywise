// noinspection JSUnresolvedReference,SpellCheckingInspection,JSUnusedGlobalSymbols,DuplicatedCode


async function tagExpenses() {

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




