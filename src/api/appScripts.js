

async function myFunction() {

  const Config = "config";
  const LastGmailId = "lastGmailId";
  const TagMap = "tagMap";

  // let inbox = GmailApp.getInboxThreads(0, 20);
  res = Gmail.Users.Messages.list('me');
  let mailIdList = res.messages.map((res) => res.id);

  // console.log(setOneDoc("config1", "lastGmailId", "lastMailId"));
  // return;

  // console.log(mailIdList);

  //194eaa0858bfc2fe

  const tagMap = getAllDoc(TagMap);


  let lastMailId;

  mailIdList = mailIdList.reverse();

  let res_doc = getOneDoc(Config, LastGmailId);
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

  // return;

  for (const mailIndex in mailIdList) {
    let mailId = mailIdList[mailIndex];
    res = Gmail.Users.Messages.get('me', mailId);

    const snippet = res.snippet;
    let expense;

    if (snippet.includes('E-mandate')) {
      console.log('-> E-mandate mail');
    }

    else if (snippet.includes('Thank you for using your HDFC Bank Credit Card ending 5667')) {

      const CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card \
      ending 5667 for Rs 858.20 at ZOMATO on 09-02-2025 22:08:17. \
      Authorization code:- 059556 After the above transaction, the available'

      const creditCardCostRegex = /Rs\b\W\b.+ at/g; // 'Rs 24.00 at'
      const creditCardVendorRegex = /at\b\W\b.+ on \b\d{2}-\d{2}\b/g; // 'at MEDPLUS KONNENA AGRAHA on 09-02'

      console.log('-> snippet: ', snippet);
      console.log('-> snippet:1 ', snippet.match(creditCardCostRegex));
      console.log('-> snippet: ', snippet);
      console.log('-> snippet:2 ', snippet.match(creditCardVendorRegex));


      let cost = snippet.match(creditCardCostRegex)[0].replace('Rs ', '').replace(' at', '');
      let vendor = snippet.match(creditCardVendorRegex)[0].replace('at ', '').slice(0, -9);


      expense = getExpense(Number(res.internalDate), 'credit', mailId);

      expense.cost = Number(cost)
      expense.vendor = vendor

      const obj = tagMap.find(({ vendorVal }) => expense.vendor === vendorVal);

      if (obj) {
        expense.tag = obj.tag;
      }


      addExpense(expense);

      console.log('-> Credit card cost: ', expense.cost);
      console.log('-> Credit card snippet: ', snippet);
      console.log('-> Credit card expense: ', expense);

    }

    else if (snippet.includes('Your UPI transaction')) {


      if (snippet.includes('successfully credited')) {



        const UPI_MSG_CREDIT = 'Dear Customer, Rs.85.00 is successfully credited to your account \
        **1811 by VPA aayushXYZ@okaxis AYUSH SHARMA on 09-02-25. Your UPI \
        transaction reference number is 5048888888. Thank you for';

        const upiCreditCostRegex = /Rs\b\W\b.+ is successfully/g; // 'Rs.85.00 is successfully'
        const upiCreditVendorRegex = /VPA\b\W\b.+ on \b\d{2}-\d{2}\b/g; // 'VPA aayushXYZ@okaxis AYUSH SHARMA on 09-02'

        console.log('-> snippet: ', snippet);
        console.log('-> snippet:1 ', snippet.match(upiCreditCostRegex));
        console.log('-> snippet:2 ', snippet.match(upiCreditVendorRegex));

        let cost = snippet.match(upiCreditCostRegex)[0].replace('Rs.', '').replace(' is successfully', '');
        let vendor = snippet.match(upiCreditVendorRegex)[0].replace('VPA ', '').slice(0, -9);

        expense = getExpense(Number(res.internalDate), 'upi-credit', mailId);

        expense.cost = Number(cost)
        expense.vendor = vendor


        const obj = tagMap.find(({ vendorVal }) => expense.vendor === vendorVal)

        if (obj) {
          expense.tag = obj.tag;
        }

        addExpense(expense);

        console.log('-> UPI credit cost: ', expense.cost);
        console.log('-> UPI credit snippet: ', snippet);
        console.log('-> UPI credit expense: ', expense);

      } else {


        const UPI_MSG_DEBIT = 'Dear Customer, Rs.10.00 has been debited from account **1811 \
        to VPA yash-1@okicici YASH R ABC on 09-02-25.\
        Your UPI transaction reference number is 5048888888. If you did not'

        const upiDebitCostRegex = /Rs\b\W\b.+ has been/g; // 'Rs.11.00 has been'
        const upiDebitVendorRegex = /VPA\b\W\b.+ on \b\d{2}-\d{2}\b/g; // 'VPA yash-1@okicici YASH R ABC on 10-02'

        console.log('-> snippet: ', snippet);
        console.log('-> snippet:1 ', snippet.match(upiDebitCostRegex));
        console.log('-> snippet:2 ', snippet.match(upiDebitVendorRegex));

        let cost = snippet.match(upiDebitCostRegex)[0].replace('Rs.', '').replace(' has been', '');
        let vendor = snippet.match(upiDebitVendorRegex)[0].replace('VPA ', '').slice(0, -9);

        expense = getExpense(Number(res.internalDate), 'upi-debit', mailId);

        expense.cost = Number(cost)
        expense.vendor = vendor


        const obj = tagMap.find(({ vendorVal }) => expense.vendor === vendorVal)

        if (obj) {
          expense.tag = obj.tag;
        }

        addExpense(expense);

        console.log('-> UPI debit cost: ', expense.cost);
        console.log('-> UPI debit snippet: ', snippet);
        console.log('-> UPI debit expense: ', expense);

      }
    }

    lastMailId = mailId;

  }


  if (lastMailId) {
    console.log('Post execution last mail id ', lastMailId);
    setOneDoc("config", "lastGmailId", lastMailId);
  }


}


const getExpense = (date, type, mailId) => {
  return {
    cost: 0,
    vendor: null,
    tag: null,
    type,
    date,
    user: 'rushi',
    mailId
  };
}


const addExpense = async (expense) => {

  const url = "https://us-central1-finance-app-361514.cloudfunctions.net/addExpenseData";

  var options = {
    "method": "post",
    "headers": { "Content-Type": "application/json" },
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

  var options = {
    "method": "post",
    "headers": { "Content-Type": "application/json" },
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

  var options = {
    "method": "post",
    "headers": { "Content-Type": "application/json" },
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

  var options = {
    "method": "post",
    "headers": { "Content-Type": "application/json" },
    "payload": JSON.stringify(data)
  };

  const resp = UrlFetchApp.fetch(url, options);
  return resp.getContentText() ? JSON.parse(resp.getContentText()) : null;
}




