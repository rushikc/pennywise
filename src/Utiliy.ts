


export const getDateTime = (time: string) => {

return new Date('1970-01-01T' + time + ':00' + 'Z')
  .toLocaleTimeString('en-US',
    {timeZone:'UTC',hour12:true,hour:'numeric',minute:'numeric'}
  );

}


export const sortByTime = (array: any[], key: string, order: string = 'asc') => {

array.sort((function (a, b) { 
    //@ts-ignore
    return new Date(b[key]) - new Date(a[key]) 
  }));

  return array;
}
