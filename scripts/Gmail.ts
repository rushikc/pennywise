export const firebaseConfig = () => null; // empty function to avoid errors in unused code

/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/


// This script is used to fetch expenses from Gmail and update the database locally.
// you need to valid desktop service account credentials to make below code work.


// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore/lite";
// import { firebaseConfig } from "../src/firebase/firebase-public";
// import { ExpenseAPI } from "../src/api/ExpenseAPI";
//
// const path = require('path');
// const processVar = require('process');
// const { authenticate } = require('@google-cloud/local-auth');
// const { google } = require('googleapis');
// const fs = require('fs').promises;
//
// // If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// // The file token.json stores the user's access and refresh tokens, and is
// // created automatically when the authorization flow completes for the first
// // time.
// const TOKEN_PATH = path.join(processVar.cwd(), 'token.json');
// const CREDENTIALS_PATH = path.join(processVar.cwd(), '../credentials/credentials_finance_desktop.json');
//
//
//
//
// const firebaseConfig = firebaseConfig();
//
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
//
//
//
//
// /**
//  * Reads previously authorized credentials from the save file.
//  *
//  * @return {Promise<OAuth2Client|null>}
//  */
// async function loadSavedCredentialsIfExist() {
//   try {
//     const content = await fs.readFile(TOKEN_PATH);
//     const credentials = JSON.parse(content);
//     return google.auth.fromJSON(credentials);
//   } catch (err) {
//     return null;
//   }
// }
//
//
// export const getGAuth = async function (content: any) {
//   try {
//     const credentials = JSON.parse(content);
//     let client = google.auth.fromJSON(credentials);
//     if (client) {
//       return client;
//     }
//     else {
//       console.log('client not loaded');
//     }
//   } catch (err) {
//     return null;
//   }
// }
//
//
// /**
//  * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
//  *
//  * @param {OAuth2Client} client
//  * @return {Promise<void>}
//  */
// async function saveCredentials(client: any) {
//   const content = await fs.readFile(CREDENTIALS_PATH);
//   const keys = JSON.parse(content);
//   const key = keys.installed || keys.web;
//   const payload = JSON.stringify({
//     type: 'authorized_user',
//     client_id: key.client_id,
//     client_secret: key.client_secret,
//     refresh_token: client.credentials.refresh_token,
//   });
//   await fs.writeFile(TOKEN_PATH, payload);
// }
//
// /**
//  * Load or request or authorization to call APIs.
//  *
//  */
// async function authorize() {
//   let client = await loadSavedCredentialsIfExist();
//   if (client) {
//     return client;
//   }
//   client = await authenticate({
//     scopes: SCOPES,
//     keyfilePath: CREDENTIALS_PATH,
//   });
//   if (client.credentials) {
//     await saveCredentials(client);
//   }
//   return client;
// }
//
//
// const getExpense = (timeStamp: any) => {
//   return {
//     cost: 0,
//     vendor: null,
//     tag: null,
//     date: new Date(timeStamp),
//     user: 'xyz',
//   };
// }
//
//
//
//
//
//
// /**
//  * Lists the labels in the user's account.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// export const updateFromGmail = async function (auth: any) {
//   const gmail = google.gmail({ version: 'v1', auth });
//
//
//   let res;
//
//   // 1670336683000
//
//   // let latestMailId = mailIdList[0];
//   // let latestMailId = '184dcd69f8dd24bc'; // credit
//   // let latestMailId = '184e5b17d09c1ebf'; // UPI
//   // let latestMailId = '184e45269f530c10'; // E-mandate
//   // let latestMailId = '184e59fd5d755b34';
//
//   // res = await gmail.users.messages.get({
//   //   userId: 'me',
//   //   id: latestMailId
//   // });
//
//
//   // console.log(res.data);
//
//
//
//
//
//   let lastUpdateStartTime;
//
//   // await ExpenseAPI.getConfig('gmailLastUpdated')
//   // .then(response => lastUpdateStartTime = response);
//
//
//   let temp = Date.now() / 1000;
//   let updateStartTime = Math.trunc(temp);
//
//   res = await gmail.users.messages.list({
//     userId: 'me',
//     q: 'after:' + lastUpdateStartTime
//   });
//
//
//   console.log(res.data);
//   // return;
//
//   // if(res.data.resultSizeEstimate === 0){
//   //   ExpenseAPI.addConfig('gmailLastUpdated', updateStartTime);
//   //   console.log("\n\n\n\n");
//   //   return;
//   // }
//
//
//   //@ts-ignore
//   let mailIdList = res.data.messages.map((res) => res.id);
//
//   // console.log(mailIdList);
//
//
//
//
//   // let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card '+
//   // 'ending 8566 for Rs 283.00 at EATCLUBBRANDSPRIVATELI on 04-12-2022 16:42:34.'+
//   // ' After the above transaction'
//   let CREDIT_CARD_MSG = 'Dear Card Member, Thank you for using your HDFC Bank Credit Card ' +
//     'ending 8566 for Rs XX1 at XX2 on XX3 XX4' +
//     ' After the above transaction';
//
//   // let UPI_MSG = 'Dear Customer, Rs.20.00 has been debited from account **1811 to VPA ' +
//   // 'paytmqr2810050501011u8l4cw7fokm@paytm on 06-12-22. Your UPI transaction reference number' +
//   // ' is 234006737725. Please call on 18002586161'
//   let UPI_MSG = 'Dear Customer, XX1 has been debited from account **1811 to VPA ' +
//     'XX2 on 06-12-22. Your UPI transaction reference number' +
//     ' is 234006737725. Please call on 18002586161'
//
//
//   let expenseList = [];
//
//   for (const mailIndex in mailIdList) {
//
//     // console.log(mailIndex);
//
//     res = await gmail.users.messages.get({
//       userId: 'me',
//       id: mailIdList[mailIndex]
//     });
//
//
//     let snippet = res.data.snippet
//
//     let expense;
//
//     if (snippet.includes('E-mandate')) {
//       console.log('-> E-mandate mail');
//     }
//
//     else if (snippet.includes('Thank you for using your HDFC Bank Credit Card ending 8566')) {
//
//       let CREDIT_CARD_MSG_SPLIT = CREDIT_CARD_MSG.split(' ');
//       let SNIPPET_SPLIT = snippet.split(' ');
//
//       let rsIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX1');
//       let vendorIndex = CREDIT_CARD_MSG_SPLIT.indexOf('XX2');
//
//       expense = getExpense(Number(res.data.internalDate));
//
//       expense.cost = Number(SNIPPET_SPLIT[rsIndex])
//       expense.vendor = SNIPPET_SPLIT[vendorIndex]
//
//       expenseList.push(expense);
//
//       console.log('-> Credit card: ', expense.cost);
//
//     }
//
//     else if (snippet.includes('Your UPI transaction')) {
//
//       let UPI_MSG_SPLIT = UPI_MSG.split(' ');
//       let SNIPPET_SPLIT = snippet.split(' ');
//
//       let rsIndex = UPI_MSG_SPLIT.indexOf('XX1');
//       let vendorIndex = UPI_MSG_SPLIT.indexOf('XX2');
//
//
//       expense = getExpense(Number(res.data.internalDate));
//
//       expense.cost = Number(SNIPPET_SPLIT[rsIndex].replace('Rs.', ''))
//       expense.vendor = SNIPPET_SPLIT[vendorIndex]
//
//       expenseList.push(expense);
//
//       console.log('-> UPI trans: ', expense.cost);
//     }
//
//     ExpenseAPI.addExpense(expense)
//       .then(response => console.log("Updated record"));
//
//   }
//
//   // console.log("Final expense list -> ", expenseList);
//   console.log("Final expense list -> ", expenseList.length);
//
//
//
//   // ExpenseAPI.addConfig('gmailLastUpdated', updateStartTime);
//
//   console.log("\n\n\n\n");
//
//
// }
//
//
// authorize().then(updateFromGmail).catch(console.error);
//
//
// // setInterval(() => authorize().then(updateFromGmail).catch(console.error), 500000);
