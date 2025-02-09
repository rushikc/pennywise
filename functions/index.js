

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

  const tagMap = getAllDoc(TagMap);


  // let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card '+
  // 'ending 2168 for Rs 283.00 at EATCLUBBRANDSPRIVATELI on 04-12-2022 16:42:34.'+
  // ' After the above transaction'
  let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card '+
  'ending 5667 for Rs XX1 at XX2 on XX3 XX4'+
  ' After the above transaction';

  // let UPI_MSG = 'Dear Customer, Rs.20.00 has been debited from account **1811 to VPA ' + 
  // 'paytmqr2810050501011u8l4cw7fokm@paytm on 06-12-22. Your UPI transaction reference number' + 
  // ' is 234006737725. Please call on 18002586161'
  let UPI_MSG_DEBIT = 'Dear Customer, XX1 has been debited from account **1811 to VPA ' + 
  'XX2 on 06-12-22. Your UPI transaction reference number' + 
  ' is 234006737725. Please call on 18002586161'

  let UPI_MSG_CREDIT = 'Dear Customer, XX1 is successfully credited to your ' + 
  'account **1811 by VPA XX2 on 13-10-24. Your UPI transaction reference number is 731576487136.'
  let lastMailId;

  mailIdList = mailIdList.reverse();

  let res_doc = getOneDoc(Config, LastGmailId);
  let mailId;

  if(res_doc){
    mailId = res_doc.value;
  }else{
    mailId = "";
  }

  console.log(mailId);

  console.log(mailIdList.indexOf(mailId));
  let lastMailIdIndex = mailIdList.indexOf(mailId); 
  mailIdList = mailIdList.slice(lastMailIdIndex+1);
  console.log(mailIdList);
  
  // return;

  for (const mailIndex in mailIdList) {    
    let mailId = mailIdList[mailIndex];
    res = Gmail.Users.Messages.get('me', mailId);
  
    let snippet  = res.snippet.replace('Dear Customer,Dear Customer,', 'Dear Customer,');
    let expense;
  
    if(snippet.includes('E-mandate')){
      console.log('-> E-mandate mail');
    }
    
    else if(snippet.includes('Thank you for using your HDFC Bank Credit Card ending 5667')){
  
      let CREDIT_CARD_MSG_SPLIT = CREDIT_CARD_MSG.split(' ');
      let SNIPPET_SPLIT = snippet.split(' ');
  
      let rsIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX1');
      let vendorIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX2');
  
      expense = getExpense(Number(res.internalDate), 'credit', mailId);
  
      expense.cost = Number(SNIPPET_SPLIT[rsIndex])
      expense.vendor = SNIPPET_SPLIT[vendorIndex]

      const obj = tagMap.find(({vendor}) => expense.vendor === vendor);

      if(obj){
        expense.tag = obj.tag;
      }


      addExpense(expense);

      console.log('-> Credit card: ', expense.date);
      console.log('-> Credit card: ', expense.cost);
      // console.log('-> Credit card: ', expense.tag);

    }
  
    else if(snippet.includes('Your UPI transaction')){
      
      let UPI_MSG_SPLIT = UPI_MSG_DEBIT.split(' ');
      let SNIPPET_SPLIT = snippet.split(' ');
  
      let rsIndex = UPI_MSG_SPLIT.indexOf('XX1');
      let vendorIndex = UPI_MSG_SPLIT.indexOf('XX2');
  
  
      expense = getExpense(Number(res.internalDate), 'upi', mailId);
  
      expense.cost = Number(SNIPPET_SPLIT[rsIndex].replace('Rs.', '').trim())
      expense.vendor = SNIPPET_SPLIT[vendorIndex]

      const obj = tagMap.find(({vendor}) => expense.vendor === vendor)

      if(obj){
        expense.tag = obj.tag;
      }

      addExpense(expense);

      console.log('-> UPI trans: ', expense.date);
      console.log('-> UPI trans: ', expense.cost);
      console.log('-> UPI snippet: ', snippet);


    }

    lastMailId = mailId;

  }


  if(lastMailId){
    console.log('lastMailId ', lastMailId);
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

  const url = "https://us-central1-finance-app-361514.cloudfunctions.net/";

  var options = {
    "method": "post",
    "headers": {"Content-Type": "application/json"},
    "payload": JSON.stringify(expense)
  };

  UrlFetchApp.fetch(url, options);

}




const setOneDoc =  (collection, key, value) => {
    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/setOneDoc";

    const data = {
      key,
      collection,
      json: {value}
    }

    var options = {
      "method": "post",
      "headers": {"Content-Type": "application/json"},
      "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    return resp.getContentText();
}


const getOneDoc =  (collection, key) => {
    const url = "https://us-central1-finance-app-361514.cloudfunctions.net/getOneDoc";

    const data = {
      key,
      collection
    }

    var options = {
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

    var options = {
      "method": "post",
      "headers": {"Content-Type": "application/json"},
      "payload": JSON.stringify(data)
    };

    const resp = UrlFetchApp.fetch(url, options);
    return resp.getContentText() ? JSON.parse(resp.getContentText()) : null;
}




