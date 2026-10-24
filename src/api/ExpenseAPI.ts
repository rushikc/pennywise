/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BankConfig, BankEmailParsingEntry, Budget, DuplicateCandidatePair, Expense, VendorTag} from '../Types';
import {getDataMode} from '../pages/login/dataMode';
import {isHiddenDuplicate} from './duplicateLogic';
import {DemoExpenseAPI} from './DemoExpenseAPI';
import {LiveExpenseAPI} from './LiveExpenseAPI';
import {ClientUserCollection} from './firestorePaths';

export type {DocumentData} from './LiveExpenseAPI';

const api = () => getDataMode() === 'demo' ? DemoExpenseAPI : LiveExpenseAPI;

export class ExpenseAPI {

  static isHiddenDuplicate = isHiddenDuplicate;

  static getEmailParseBankList = (): Promise<BankEmailParsingEntry[]> =>
    api().getEmailParseBankList();

  static updateEmailParseBankList = (banks: BankEmailParsingEntry[]): Promise<boolean> =>
    api().updateEmailParseBankList(banks);

  static setOneDoc = (key: string, val: unknown, collectionName: ClientUserCollection = 'config') =>
    api().setOneDoc(key, val, collectionName);

  static getOneDoc = (key: string, collectionName: ClientUserCollection = 'config') =>
    api().getOneDoc(key, collectionName);

  static deleteOneDoc = (key: string, collectionName: ClientUserCollection = 'config') =>
    api().deleteOneDoc(key, collectionName);

  static processData = () => api().processData();

  static addExpense = (_expense: Expense, operation = 'update'): Promise<Expense> =>
    api().addExpense(_expense, operation);

  static deleteExpense = (expense: Expense): Promise<boolean> =>
    api().deleteExpense(expense);

  static getExpenseList = (overrideLastDate: number | undefined = undefined): Promise<Expense[]> =>
    api().getExpenseList(overrideLastDate);

  static getDuplicateCandidates = (): Promise<DuplicateCandidatePair[]> =>
    api().getDuplicateCandidates();

  static resolveDuplicate = (
    keep: Expense,
    drop: Expense,
    action: 'confirmed' | 'rejected',
  ): Promise<Expense> => api().resolveDuplicate(keep, drop, action);

  static getTagList = () => api().getTagList();

  static updateTagList = (tags: string[]) => api().updateTagList(tags);

  static getBankConfig = (): Promise<BankConfig> => api().getBankConfig();

  static updateBankConfig = (config: BankConfig) => api().updateBankConfig(config);

  static getDarkModeConfig = (): Promise<boolean> => api().getDarkModeConfig();

  static updateDarkMode = (val: boolean) => api().updateDarkMode(val);

  static getVendorTagList = (): Promise<VendorTag[]> => api().getVendorTagList();

  static updateVendorTag = (vendorTag: VendorTag) => api().updateVendorTag(vendorTag);

  static deleteVendorTag = (vendorTagId: string) => api().deleteVendorTag(vendorTagId);

  static autoTagPastExpenses = (startDate: number): Promise<number> =>
    api().autoTagPastExpenses(startDate);

  static addBudget = (_budget: Budget, operation = 'update'): Promise<Budget> =>
    api().addBudget(_budget, operation);

  static updateBudget = (_budget: Budget): Promise<Budget> =>
    api().updateBudget(_budget);

  static deleteBudget = (budget: Budget): Promise<boolean> =>
    api().deleteBudget(budget);

  static getBudgetList = (overrideLastDate: number | undefined = undefined): Promise<Budget[]> =>
    api().getBudgetList(overrideLastDate);
}
