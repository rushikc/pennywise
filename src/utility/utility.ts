import { DateTime } from "luxon";




// dates

export const getISODate = (seconds: number) : Date => {
    return new Date(seconds * 1000)
}


export const getDate = (seconds: number) : string => {
    return DateTime.fromISO(getISODate(seconds).toISOString()).toLocaleString(DateTime.DATE_MED)
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