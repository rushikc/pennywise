/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export type BankEntry = {
  displayName?: string;
  matchStrings?: string[];
};

export function findEmailParseBankMatch(text: string, banks: BankEntry[] | null | undefined): string | null {
  if (!text || !banks || !banks.length) {
    return null;
  }
  const haystack = text.toUpperCase();
  for (const entry of banks) {
    const phrases = entry.matchStrings || [];
    const display = entry.displayName || '';
    for (const phrase of phrases) {
      const p = String(phrase).trim().toUpperCase();
      if (p && haystack.indexOf(p) !== -1) {
        return display || 'Bank';
      }
    }
  }
  return null;
}

export function gmailSearchQuery(banks: BankEntry[], afterMs: number | null): string {
  const phrases = (banks || [])
    .flatMap((bank) => bank.matchStrings || [])
    .map((phrase) => String(phrase).trim())
    .filter(Boolean)
    .map((phrase) => `"${phrase.replace(/"/g, '')}"`);
  const unique = [...new Set(phrases)];
  const phraseQuery = unique.length ? `(${unique.join(' OR ')})` : '';
  let afterQuery = '';
  if (afterMs) {
    const date = new Date(afterMs);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    afterQuery = `after:${y}/${m}/${d}`;
  }
  return [phraseQuery, afterQuery, 'in:inbox'].filter(Boolean).join(' ');
}
