import {Expense} from '../Types';
import {getUnixTimestamp, JSONCopy} from '../utility/utility';
import {ExpenseListNew} from './expense';

export const GET_LATEST_EXPENSE = () => {
  // let expenses: Expense[] = JSONCopy(ExpenseList);

  const expensesNew: Expense[] = JSONCopy(ExpenseListNew);
  // console.log("Expense copy",expensesNew);
  const today = getUnixTimestamp(new Date());

  const diff = today - expensesNew[0].date;

  expensesNew.forEach(expense => {
    expense.date = expense.date + diff;
    expense.modifiedDate = expense.modifiedDate + diff;
  });


  const largeExpenses = expensesNew.filter(val => val.cost < 30000);
  // const lastMonths = expenses.filter(val => val.date > getUnixTimestamp(new Date('2025-02-03')));

  // console.log("Large Expense ",largeExpenses);
  // console.log("Large Expense ", lastMonths);

  return largeExpenses;
};
