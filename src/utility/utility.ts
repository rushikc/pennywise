/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import dayjs, {Dayjs} from 'dayjs';
// Add necessary dayjs plugins
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Initialize dayjs plugins
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);


//daysJs


export const getDayJs = (date: Date = new Date()) => {
  return dayjs(date);
};

export const getDayJsToDate = (date: Dayjs) => {
  return dayjs().toDate();
};

export const getUnixTimestamp = (date: Date | string) => {
  return dayjs(date).unix() * 1000;
};

export const getCurrentDate = (format: string = 'YYYY-MM-DD') => {
  return dayjs().format(format);
};

export const getDateFormat = (date: Dayjs) => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const getDateFromString = (date: string, format = 'YYYY-MM-DD') => {
  return dayjs(date, format);
};


export const getDateMonth = (date: number) => {
  return dayjs(new Date(date)).format('DD MMM');
};

export const getDateMonthTime = (date: number = Date.now()) => {
  return dayjs(new Date(date)).format('DD MMM YY, hh:mm A');
};

export const getDateMedJs = (seconds: number) => {
  return dayjs(seconds * 1000).format('DD MMM YY, hh:mm A');
};

export const getDateJsIdFormat = (date: Date) => {
  return dayjs(date).format('DD MMM YY, hh:mm A');
};

export const getTimeJs = (date: Date) => {
  return dayjs(date).format('hh:mm A');
};


// dates

export const getDateToEpoch = (date: Date): number => {
  return date.valueOf();
};

export const getISODate = (seconds: number): Date => {
  return new Date(seconds * 1000);
};


export const getDateTimeSecFromISO = (isoTime: string): string => {
  // Using dayjs to parse ISO string and format with localized short datetime with seconds
  return dayjs(isoTime).format('MM/DD/YYYY, hh:mm:ss A');
};


//sort


export const sortBy2Key = (array: any[], key: string, subKey: string) => {
  return array.sort((function (a, b) {
    //@ts-ignore
    return (b[key][subKey] - a[key][subKey]);
  }));
};


export const sortByKey = (array: any[], key: string) => {
  return array.sort((function (a, b) {
    //@ts-ignore
    return (b[key] - a[key]);
  }));
};


export const sortByKeyDate = (array: any[], key: string) => {

  return array.sort((function (a, b) {
    //@ts-ignore
    return (b[key] - a[key]);
  }));
};

export const JSONCopy = (Obj: any) => {
  return JSON.parse(JSON.stringify(Obj));
};


export const insertAtIndex = <T>(arr: T[], index: number, element: T): T[] => {
  if (index < 0 || index > arr.length) {
    throw new Error('Index out of bounds');
  }

  const newArr = [...arr]; // Create a copy to avoid modifying the original array

  newArr.splice(index, 0, element); // Use splice to insert the element

  return newArr;
};

/**
 * Custom development warning function (clone of console.warn)
 * @param message Primary message to display
 * @param optionalParams Additional parameters to log
 */
export const devWarn = (message?: any, ...optionalParams: any[]): void => {
  console.warn(message, ...optionalParams);
};
