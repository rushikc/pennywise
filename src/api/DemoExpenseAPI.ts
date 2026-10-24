/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BankConfig, BankEmailParsingEntry, Budget, DuplicateCandidatePair, Expense, VendorTag} from '../Types';
import {getDateJsIdFormat, JSONCopy} from '../utility/utility';
import {applyDuplicateResolution, isHiddenDuplicate} from './duplicateLogic';
import {DemoStore} from '../demoData/createDemoStore';
import {ClientUserCollection} from './firestorePaths';

export class DemoExpenseAPI {

  private static storePromise: Promise<DemoStore> | null = null;

  private static getStore = async (reseed = false): Promise<DemoStore> => {
    if (reseed || !DemoExpenseAPI.storePromise) {
      DemoExpenseAPI.storePromise = import(
        /* webpackChunkName: "demo-data" */
        '../demoData/createDemoStore'
      ).then((mod) => mod.createDemoStore());
    }
    return DemoExpenseAPI.storePromise;
  };

  private static docKey = (collectionName: ClientUserCollection, key: string) => `${collectionName}/${key}`;

  static isHiddenDuplicate = isHiddenDuplicate;

  static getEmailParseBankList = async (): Promise<BankEmailParsingEntry[]> => {
    const store = await DemoExpenseAPI.getStore();
    return JSONCopy(store.emailParseBanks);
  };

  static updateEmailParseBankList = async (banks: BankEmailParsingEntry[]): Promise<boolean> => {
    const store = await DemoExpenseAPI.getStore();
    store.emailParseBanks = JSONCopy(banks);
    return true;
  };

  static setOneDoc = async (key: string, val: unknown, collectionName: ClientUserCollection = 'config') => {
    const store = await DemoExpenseAPI.getStore();
    store.docs[DemoExpenseAPI.docKey(collectionName, key)] = JSONCopy(val);
  };

  static getOneDoc = async (key: string, collectionName: ClientUserCollection = 'config') => {
    const store = await DemoExpenseAPI.getStore();
    const saved = store.docs[DemoExpenseAPI.docKey(collectionName, key)];
    return saved == null ? null : JSONCopy(saved);
  };

  static deleteOneDoc = async (key: string, collectionName: ClientUserCollection = 'config') => {
    const store = await DemoExpenseAPI.getStore();
    delete store.docs[DemoExpenseAPI.docKey(collectionName, key)];
    return true;
  };

  static processData = async () => {
    return;
  };

  static addExpense = async (_expense: Expense, operation = 'update'): Promise<Expense> => {
    const store = await DemoExpenseAPI.getStore();
    const expense = JSONCopy(_expense);
    const key = getDateJsIdFormat(new Date(expense.date)) + ' ' + expense.vendor.slice(0, 10);
    expense.modifiedDate = Date.now();
    expense.cost = Number(expense.cost.toFixed(2));
    expense.operation = operation;
    expense.id = key;

    const index = store.expenses.findIndex((item) => item.mailId === expense.mailId || item.id === expense.id);
    if (index > -1) {
      store.expenses[index] = expense;
    } else {
      store.expenses.push(expense);
    }
    return expense;
  };

  static deleteExpense = async (expense: Expense): Promise<boolean> => {
    const store = await DemoExpenseAPI.getStore();
    store.expenses = store.expenses.filter(
      (item) => item.id !== expense.id && item.mailId !== expense.mailId,
    );
    return true;
  };

  static getExpenseList = async (overrideLastDate: number | undefined = undefined): Promise<Expense[]> => {
    const store = await DemoExpenseAPI.getStore(overrideLastDate !== undefined);
    return store.expenses
      .filter((item) => item.operation !== 'delete')
      .filter((item) => !DemoExpenseAPI.isHiddenDuplicate(item));
  };

  static getDuplicateCandidates = async (): Promise<DuplicateCandidatePair[]> => {
    const store = await DemoExpenseAPI.getStore();
    const all = store.expenses;
    const pending = all.filter((item) => item.dupeStatus === 'pending' && Boolean(item.dupeCandidateOf));
    const pairs: DuplicateCandidatePair[] = [];
    for (const drop of pending) {
      const keep = all.find((item) => item.id === drop.dupeCandidateOf);
      if (!keep) {
        continue;
      }
      pairs.push({
        keep,
        drop,
        rule: drop.dupeRule || 'review',
      });
    }
    return pairs;
  };

  static resolveDuplicate = async (
    keep: Expense,
    drop: Expense,
    action: 'confirmed' | 'rejected',
  ): Promise<Expense> => {
    const updated = applyDuplicateResolution(drop, keep, action);
    return DemoExpenseAPI.addExpense(updated);
  };

  static getTagList = async () => {
    const store = await DemoExpenseAPI.getStore();
    return JSONCopy(store.tags);
  };

  static updateTagList = async (tags: string[]) => {
    const store = await DemoExpenseAPI.getStore();
    store.tags = JSONCopy(tags);
  };

  static getBankConfig = async (): Promise<BankConfig> => {
    const store = await DemoExpenseAPI.getStore();
    return JSONCopy(store.bankConfig);
  };

  static updateBankConfig = async (config: BankConfig) => {
    const store = await DemoExpenseAPI.getStore();
    store.bankConfig = JSONCopy(config);
    return true;
  };

  static getDarkModeConfig = async (): Promise<boolean> => {
    const store = await DemoExpenseAPI.getStore();
    return store.darkMode;
  };

  static updateDarkMode = async (val: boolean) => {
    const store = await DemoExpenseAPI.getStore();
    store.darkMode = val;
    return true;
  };

  static getVendorTagList = async (): Promise<VendorTag[]> => {
    const store = await DemoExpenseAPI.getStore();
    return JSONCopy(store.vendorTags);
  };

  static updateVendorTag = async (vendorTag: VendorTag) => {
    const store = await DemoExpenseAPI.getStore();
    const next = JSONCopy(vendorTag);
    if (!next.id) {
      next.id = next.vendor;
    }
    next.date = Date.now();
    const index = store.vendorTags.findIndex((item) => item.id === next.id || item.vendor === next.vendor);
    if (index > -1) {
      store.vendorTags[index] = next;
    } else {
      store.vendorTags.push(next);
    }
    return true;
  };

  static deleteVendorTag = async (vendorTagId: string) => {
    const store = await DemoExpenseAPI.getStore();
    store.vendorTags = store.vendorTags.filter((item) => item.id !== vendorTagId && item.vendor !== vendorTagId);
    return true;
  };

  static autoTagPastExpenses = async (startDate: number): Promise<number> => {
    const store = await DemoExpenseAPI.getStore();
    const vendorTagMap = new Map(store.vendorTags.map((vt) => [vt.vendor.toLowerCase(), vt.tag]));
    if (vendorTagMap.size === 0) {
      return 0;
    }

    let processedCount = 0;
    store.expenses = store.expenses.map((expense) => {
      if (expense.tag || expense.modifiedDate < startDate) {
        return expense;
      }
      const newTag = vendorTagMap.get(expense.vendor.toLowerCase());
      if (!newTag) {
        return expense;
      }
      processedCount += 1;
      return {
        ...expense,
        tag: newTag,
        modifiedDate: Date.now(),
      };
    });
    return processedCount;
  };

  static addBudget = async (_budget: Budget, operation = 'update'): Promise<Budget> => {
    const store = await DemoExpenseAPI.getStore();
    const budget = JSONCopy(_budget);
    const key = budget.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    budget.modifiedDate = Date.now();
    budget.operation = operation;
    budget.id = key;
    store.budgets.push(budget);
    return budget;
  };

  static updateBudget = async (_budget: Budget): Promise<Budget> => {
    const store = await DemoExpenseAPI.getStore();
    const budget = JSONCopy(_budget);
    budget.modifiedDate = Date.now();
    const index = store.budgets.findIndex((item) => item.id === budget.id);
    if (index > -1) {
      store.budgets[index] = budget;
    } else {
      store.budgets.push(budget);
    }
    return budget;
  };

  static deleteBudget = async (budget: Budget): Promise<boolean> => {
    const store = await DemoExpenseAPI.getStore();
    store.budgets = store.budgets.filter((item) => item.id !== budget.id);
    return true;
  };

  static getBudgetList = async (overrideLastDate: number | undefined = undefined): Promise<Budget[]> => {
    void overrideLastDate;
    const store = await DemoExpenseAPI.getStore();
    return store.budgets.filter((item) => item.operation !== 'delete');
  };
}
