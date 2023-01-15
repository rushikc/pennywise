ExpenseAPI.addExpenses([
    {
      cost: cost,
      vendor: vendor,
      user: 'rushi',
      e_json: JSON.stringify(eJson)
    },
    {
      cost: 280.25,
      vendor: 'UDUPI',
      user: 'rushi',
      e_json: JSON.stringify(eJson)
    },
  ])
  .then(response => console.log(response));

  // res = await gmail.users.messages.get({
  //   userId: 'me',
  //   // id: 'INBOX'
  //   id: '184d66a1cf263f7f' // HDFC 
  // });


  // // console.log(res.data.snippet);
  // console.log(res.data);


  // res = await gmail.users.messages.get({
  //   userId: 'me',
  //   // id: 'INBOX'
  //   id: '184d3826ace42eba' // HDFC 
  // });


  // // console.log(res.data.snippet);
  // console.log(res.data);


  // console.log(res.data.payload);

  // let base64Body = res.data.payload.parts[0].body.data;

  // let base64Body = res.data.payload.body.data;
  // let body = Buffer.from(base64Body, 'base64');
  // console.log(body.toString('ascii'));


  // console.log(res);
  // console.log(res.data.payload.parts[0].body.data);


  // console.log(res.data.payload.headers);
  // console.log(res.data.messages);
  // console.log(res.data.payload.parts);
  

  // const labels = res.data.labels;
  // if (!labels || labels.length === 0) {
  //   console.log('No labels found.');
  //   return;
  // }
  // console.log('Labels:');
  // labels.forEach((label: any) => {
  //   console.log(`- ${label.name}`);
  // });