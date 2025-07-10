export interface Expense {
    id: string,
    tag: string, // tag for the expense
    mailId: string, // unique identifier for the expense from mail id
    cost: number, // expense cost
    costType: 'credit' | 'debit',
    date: Date, // date of the expense
    user: string, // user who created the expense
    type: string, // upi, credit, cash, etc.
    vendor: string // vendor name for the expense
}

export interface VendorTag {
    id: string,
    vendor: string,
    tag: string,
    date: Date
}

export type TagList = string[];

export interface Config {
    key: string,
    value: string | Date
}

export interface BankConfig {
    enableUpi: boolean;
    creditCards: string[];
}
