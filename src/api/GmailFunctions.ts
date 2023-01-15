export const getExpense = (eJson: any) => {
    return {
        cost: null,
        vendor: null,
        user: 'rushi',
        e_json: JSON.stringify(eJson)
    };
}