


export const getDateTime = (time: string) => {

return new Date('1970-01-01T' + time + ':00' + 'Z')
  .toLocaleTimeString('en-US',
    {timeZone:'UTC',hour12:true,hour:'numeric',minute:'numeric'}
  );

}


export const sortByTime = (array: any[], key: string) => {

  let arr = array.sort((function (a, b) { 
    //@ts-ignore
    return new Date(b[key]) - new Date(a[key]) 
  }));

  return arr;
}

export const sortByTime2 = (array: any[], key: string, key2: string) => {

  let arr = array.sort((function (a, b) { 
    //@ts-ignore
    return b[key][key2] - a[key][key2]
  }));

  return arr;
}
