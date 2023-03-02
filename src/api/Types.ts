
export interface Expense {
    id: string,
    tag: string [],
    cost: number,
    date: {
        seconds: number
    },
    user: string,
    vendor: string
}