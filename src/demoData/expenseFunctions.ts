import {Expense} from '../Types';
import {getUnixTimestamp, JSONCopy} from '../utility/utility';
import {ExpenseListNew} from './expense';

export const GET_LATEST_EXPENSE = (): Expense[] => {
  const expensesNew: Expense[] = JSONCopy(ExpenseListNew);
  const today = getUnixTimestamp(new Date());
  const diff = today - expensesNew[0].date;

  expensesNew.forEach(expense => {
    expense.date = expense.date + diff;
    expense.modifiedDate = expense.modifiedDate + diff;
    if (!expense.operation) {
      expense.operation = 'add';
    }
  });

  return expensesNew.filter(val => val.cost < 30000);
};
