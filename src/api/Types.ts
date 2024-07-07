
export interface Expense {
    id: string,
    tag: string,
    cost: number,
    date: Date,
    user: string,
    vendor: string
}

export interface TagMap {
    tag: string,
    vendor: string
}



export interface Config {
    key: string,
    value: string | Date
}



