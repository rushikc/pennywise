export interface Expense {
    id: string,
    tag: string,
    mailId: string,
    cost: number,
    costType: string,
    date: Date,
    user: string,
    type: 'credit' | 'debit',
    vendor: string
}

export interface TagMap {
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


