import { DateTime } from "luxon";
import dayjs from "dayjs";


//daysjs

export const getDateJs = (seconds: number) => {
    return dayjs(seconds * 1000);
}


export const getDateMonth = (date: Date) => {
    return dayjs(date).format('DD MMM');
}

export const getDateMedJs = (seconds: number) => {
    return dayjs(seconds * 1000).format('DD MMM YY, hh:mm A');
}

export const getTimeJs = (date: Date) => {
    return dayjs(date).format('hh:mm A');
}


// dates

export const getISODate = (seconds: number) : Date => {
    return new Date(seconds * 1000)
}


export const getDate = (date: Date) : string => {
    return DateTime.fromJSDate(date).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
}

/**
 * {@link DateTime.toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
 */
export const getDateMed = (seconds: number) : string => {
    return DateTime.fromISO(getISODate(seconds).toISOString()).toLocaleString(DateTime.TIME_SIMPLE)
}


export const getTime = (seconds: number) : string => {
    return DateTime.fromISO(getISODate(seconds).toISOString()).toLocaleString(DateTime.TIME_SIMPLE)
}


export const getDateFromISO = (isoTime: string) : string => {
    return DateTime.fromISO(isoTime).toLocaleString(DateTime.DATE_MED)
}


export const getTimeFromISO = (isoTime: string) : string => {
    return DateTime.fromISO(isoTime).toLocaleString(DateTime.TIME_SIMPLE)
}


export const getTimeSecFromISO = (isoTime: string) : string => {
    return DateTime.fromISO(isoTime).toLocaleString(DateTime.TIME_WITH_SECONDS)
}


export const getDateTimeSecFromISO = (isoTime: string) : string => {
    return DateTime.fromISO(isoTime).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
}







//local storage

export const setStorage = (key: string, val: any) => {
    localStorage.setItem(key, JSON.stringify(val));
}

export const getStorage = (key: string) => {
    let val = localStorage.getItem(key);
    return val? JSON.parse(val): val;
}

export const clearStorage = () => localStorage.clear();





//sort


export const sortBy2Key = (array: any[], key: string, subKey: string) => {

    let arr = array.sort((function (a, b) { 
        //@ts-ignore
        return (b[key][subKey] - a[key][subKey]) 
    }));

    return arr;
}


export const sortByKey = (array: any[], key: string) => {

    let arr = array.sort((function (a, b) { 
        //@ts-ignore
        return (b[key] - a[key]) 
    }));

    return arr;
}


export const sortByKeyDate = (array: any[], key: string) => {

    let arr = array.sort((function (a, b) { 
        //@ts-ignore
        return (new Date(b[key]) - new Date(a[key])) 
    }));

    return arr;
}