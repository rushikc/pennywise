/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export const EXPENSE_LAST_UPDATE = 'expenseLastUpdate';
export const TAG_LAST_UPDATE = 'tagLastUpdate';
export const BUDGET_LAST_UPDATE = 'budgetLastUpdate';
export const EXPENSE_SCHEMA_VERSION_KEY = 'expenseSchemaVersion';
export const EXPENSE_SCHEMA_VERSION = 'tags-v1';

export function expenseSchemaNeedsFullRefetch(stored: string | number | undefined | null): boolean {
  return String(stored ?? '') !== EXPENSE_SCHEMA_VERSION;
}

/** IndexedDB config key; mirrors Firestore `users/{uid}/config/emailParseBanks`. */
export const EMAIL_PARSE_BANKS_CACHE_KEY = 'emailParseBanks';

export {chartColors as CHART_COLORS} from '../styles/designTokens';
