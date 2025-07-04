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
    tag: string,
    vendor: string,
    date: string
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


