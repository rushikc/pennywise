/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export type GeminiExpense = {
  cost: number;
  costType: string;
  vendor: string;
  type: string | null;
};

export function isValidExpenseGeminiShape(o: unknown): boolean {
  if (o === null || o === undefined) {
    return false;
  }
  if (typeof o !== 'object' || Array.isArray(o)) {
    return false;
  }
  const rec = o as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(rec, 'cost') ||
      !Object.prototype.hasOwnProperty.call(rec, 'costType') ||
      !Object.prototype.hasOwnProperty.call(rec, 'vendor')) {
    return false;
  }
  const costNum = Number(rec.cost);
  if (isNaN(costNum) || costNum <= 0) {
    return false;
  }
  const ct = String(rec.costType).toLowerCase().trim();
  if (ct !== 'debit' && ct !== 'credit') {
    return false;
  }
  const vendorStr = rec.vendor === null || rec.vendor === undefined ? '' : String(rec.vendor).trim();
  return Boolean(vendorStr);
}

export function normalizeGeminiExpense(o: Record<string, unknown>): GeminiExpense {
  const rawType = o.type;
  const type =
    rawType != null && String(rawType).trim() !== ''
      ? String(rawType).toLowerCase().trim()
      : null;
  return {
    cost: Number(Number(o.cost).toFixed(2)),
    costType: String(o.costType).toLowerCase().trim(),
    vendor: String(o.vendor).trim(),
    type,
  };
}

export function validateExpense(
  geminiBody: unknown,
  emailText: string,
  emailSubject: string,
  apiKey: string,
  geminiCaller?: (text: string, subject: string, apiKey: string) => unknown,
): GeminiExpense | null {
  if (geminiBody === null) {
    return null;
  }
  if (isValidExpenseGeminiShape(geminiBody)) {
    return normalizeGeminiExpense(geminiBody as Record<string, unknown>);
  }
  const retry = geminiCaller;
  if (!retry) {
    return null;
  }
  const second = retry(emailText, emailSubject, apiKey);
  if (second === null) {
    return null;
  }
  if (isValidExpenseGeminiShape(second)) {
    return normalizeGeminiExpense(second as Record<string, unknown>);
  }
  return null;
}
