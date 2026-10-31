/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BankConfig, BankEmailParsingEntry, Budget, Expense, VendorTag} from '../Types';
import {adaptExpense} from '../domain/tags';
import {JSONCopy} from '../utility/utility';
import {BUDGET_LIST} from './budgetList';
import {GET_LATEST_EXPENSE} from './expenseFunctions';
import {SAMPLE_BANKS} from './sampleBanks';
import {TAG_LIST} from './tagList';
import {PENDING_PAIRS} from './pendingPairs';
import {VendorTags} from './vendorTag';

export type DemoStore = {
  expenses: Expense[];
  budgets: Budget[];
  tags: string[];
  legacyTags: string[];
  vendorTags: VendorTag[];
  bankConfig: BankConfig;
  emailParseBanks: BankEmailParsingEntry[];
  darkMode: boolean;
  docs: Record<string, unknown>;
};

const markPendingDuplicates = (expenses: Expense[]): void => {
  for (const [keepMailId, dropMailId] of PENDING_PAIRS) {
    const keep = expenses.find((item) => item.mailId === keepMailId);
    const drop = expenses.find((item) => item.mailId === dropMailId);
    if (!keep || !drop) {
      continue;
    }
    if (drop.id === keep.id) {
      drop.id = `${drop.id} ${drop.mailId.slice(-4)}`;
    }
    drop.dupeCandidateOf = keep.id;
    drop.dupeStatus = 'pending';
    drop.dupeRule = 'review';
  }
};

export const createDemoStore = (): DemoStore => {
  const expenses = GET_LATEST_EXPENSE().map((item) => adaptExpense(item));
  markPendingDuplicates(expenses);

  return {
    expenses,
    budgets: JSONCopy(BUDGET_LIST),
    tags: JSONCopy(TAG_LIST),
    legacyTags: [],
    vendorTags: JSONCopy(VendorTags),
    bankConfig: {
      enableUpi: false,
      creditCards: [],
    },
    emailParseBanks: JSONCopy(SAMPLE_BANKS),
    darkMode: false,
    docs: {},
  };
};
