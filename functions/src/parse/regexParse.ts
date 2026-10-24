/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import config from './emailParsingConfig.json';
import {GeminiExpense} from './geminiShape';

type RegexRule = {
  snippetStrings: string[];
  costRegex: string[];
  vendorRegex: string[];
  type: string;
  costType: string;
};

function firstCapture(text: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(new RegExp(pattern, 'i'));
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function parseCost(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.]/g, '');
  const cost = Number(cleaned);
  if (isNaN(cost) || cost <= 0) {
    return null;
  }
  return Number(cost.toFixed(2));
}

export function parseExpenseWithRegex(text: string): GeminiExpense | null {
  const rules = (config as {v1: {config: RegexRule[]}}).v1.config;
  const haystack = text || '';
  const upper = haystack.toUpperCase();
  for (const rule of rules) {
    const matched = rule.snippetStrings.every((snippet) => {
      const p = String(snippet).trim().toUpperCase();
      return Boolean(p) && upper.includes(p);
    });
    if (!matched) {
      continue;
    }
    const costRaw = firstCapture(haystack, rule.costRegex);
    const vendorRaw = firstCapture(haystack, rule.vendorRegex);
    if (!costRaw || !vendorRaw) {
      continue;
    }
    const cost = parseCost(costRaw);
    if (!cost) {
      continue;
    }
    return {
      cost,
      costType: rule.costType,
      vendor: vendorRaw,
      type: rule.type,
    };
  }
  return null;
}
