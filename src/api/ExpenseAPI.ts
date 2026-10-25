/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BankConfig, BankEmailParsingEntry, Budget, DuplicateCandidatePair, Expense, VendorTag} from '../Types';
import {getDataMode} from '../pages/login/dataMode';
import {isHiddenDuplicate} from './duplicateLogic';
import {DemoExpenseAPI} from './DemoExpenseAPI';
import type {ClientUserCollection} from './firestorePaths';
import {IS_DEMO_BUILD} from '../utility/buildMode';

export type DocumentData = { [field: string]: unknown };

type ExpenseApiImpl = typeof DemoExpenseAPI;

const loadLiveExpenseAPI = () => {
  if (__DEMO_BUILD__) {
    return Promise.resolve({LiveExpenseAPI: DemoExpenseAPI});
  }
  return import('./LiveExpenseAPI');
};

const api = async (): Promise<ExpenseApiImpl> => {
  if (IS_DEMO_BUILD || getDataMode() === 'demo') {
    return DemoExpenseAPI;
  }
  const {LiveExpenseAPI} = await loadLiveExpenseAPI();
  return LiveExpenseAPI as unknown as ExpenseApiImpl;
};

export class ExpenseAPI {

  static isHiddenDuplicate = isHiddenDuplicate;

  static getEmailParseBankList = (): Promise<BankEmailParsingEntry[]> =>
    api().then((impl) => impl.getEmailParseBankList());

  static updateEmailParseBankList = (banks: BankEmailParsingEntry[]): Promise<boolean> =>
    api().then((impl) => impl.updateEmailParseBankList(banks));

  static setOneDoc = (key: string, val: unknown, collectionName: ClientUserCollection = 'config') =>
    api().then((impl) => impl.setOneDoc(key, val, collectionName));

  static getOneDoc = (key: string, collectionName: ClientUserCollection = 'config') =>
    api().then((impl) => impl.getOneDoc(key, collectionName));

  static deleteOneDoc = (key: string, collectionName: ClientUserCollection = 'config') =>
    api().then((impl) => impl.deleteOneDoc(key, collectionName));

  static processData = () => api().then((impl) => impl.processData());

  static addExpense = (_expense: Expense, operation = 'update'): Promise<Expense> =>
    api().then((impl) => impl.addExpense(_expense, operation));

  static deleteExpense = (expense: Expense): Promise<boolean> =>
    api().then((impl) => impl.deleteExpense(expense));

  static getExpenseList = (overrideLastDate: number | undefined = undefined): Promise<Expense[]> =>
    api().then((impl) => impl.getExpenseList(overrideLastDate));

  static getDuplicateCandidates = (): Promise<DuplicateCandidatePair[]> =>
    api().then((impl) => impl.getDuplicateCandidates());

  static resolveDuplicate = (
    keep: Expense,
    drop: Expense,
    action: 'confirmed' | 'rejected',
  ): Promise<Expense> => api().then((impl) => impl.resolveDuplicate(keep, drop, action));

  static getTagList = () => api().then((impl) => impl.getTagList());

  static updateTagList = (tags: string[]) => api().then((impl) => impl.updateTagList(tags));

  static getBankConfig = (): Promise<BankConfig> =>
    api().then((impl) => impl.getBankConfig());

  static updateBankConfig = (config: BankConfig) =>
    api().then((impl) => impl.updateBankConfig(config));

  static getDarkModeConfig = (): Promise<boolean> =>
    api().then((impl) => impl.getDarkModeConfig());

  static updateDarkMode = (val: boolean) =>
    api().then((impl) => impl.updateDarkMode(val));

  static getVendorTagList = (): Promise<VendorTag[]> =>
    api().then((impl) => impl.getVendorTagList());

  static updateVendorTag = (vendorTag: VendorTag) =>
    api().then((impl) => impl.updateVendorTag(vendorTag));

  static deleteVendorTag = (vendorTagId: string) =>
    api().then((impl) => impl.deleteVendorTag(vendorTagId));

  static autoTagPastExpenses = (startDate: number): Promise<number> =>
    api().then((impl) => impl.autoTagPastExpenses(startDate));

  static addBudget = (_budget: Budget, operation = 'update'): Promise<Budget> =>
    api().then((impl) => impl.addBudget(_budget, operation));

  static updateBudget = (_budget: Budget): Promise<Budget> =>
    api().then((impl) => impl.updateBudget(_budget));

  static deleteBudget = (budget: Budget): Promise<boolean> =>
    api().then((impl) => impl.deleteBudget(budget));

  static getBudgetList = (overrideLastDate: number | undefined = undefined): Promise<Budget[]> =>
    api().then((impl) => impl.getBudgetList(overrideLastDate));
}
