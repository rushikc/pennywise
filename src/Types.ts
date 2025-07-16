export interface Expense {
    id: string,
    tag: string, // tag for the expense
    mailId: string, // unique identifier for the expense from mail id
    cost: number, // expense cost
    costType: 'credit' | 'debit',
    //  unix timestamp
    // ex => 1752566845000,  unix timestamp
    // to get JS Date object, new Date(1752566845000)
    date: number,
    modifiedDate: number,
    // date: Date,
    user: string, // user who created the expense
    type: string, // upi, credit, cash, etc.
    vendor: string // vendor name for the expense
}

export interface VendorTag {
    id: string,
    vendor: string,
    tag: string,
    date: number // unix timestamp
    // date: Date
}


export type TagList = string[];


export interface BankConfig {
    enableUpi: boolean;
    darkMode: boolean;
    creditCards: string[];
}


// used to store the configuration for the app in IndexedDB
export interface Config {
    key: string,
    value: string | number
}
