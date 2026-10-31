/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Expense} from '../Types';

export const TAG_LIMITS = {
  maxTags: 8,
  maxTagLength: 40,
  maxDescription: 280,
} as const;

export type TagNormalizeOpts = {
  tagList?: string[];
  legacyTagList?: string[];
};

export type NormalizeTagsResult = {
  tags: string[];
  dropped: string[];
};

type TagDoc = {
  tags?: unknown;
  tag?: unknown;
};

const collapseWhitespace = (value: string): string => value.trim().replace(/\s+/g, ' ');

const normalizePrimaryValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = collapseWhitespace(value);
  if (!trimmed || trimmed.toLowerCase() === 'untagged') {
    return null;
  }
  return trimmed.slice(0, TAG_LIMITS.maxTagLength);
};

/**
 * Rewrites a primary to the list spelling when a case-insensitive match exists.
 * Lists never drop a value: an unmatched primary is returned as given.
 */
const canonicalPrimary = (primary: string, opts?: TagNormalizeOpts): string => {
  const lists = [...(opts?.tagList || []), ...(opts?.legacyTagList || [])];
  const match = lists.find((item) => {
    if (typeof item !== 'string') {
      return false;
    }
    return collapseWhitespace(item).toLowerCase() === primary.toLowerCase();
  });
  return match ? collapseWhitespace(match) : primary;
};

const normalizeExtraValue = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = collapseWhitespace(value).toLowerCase();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, TAG_LIMITS.maxTagLength);
};

/**
 * Normalise a primary plus extras.
 * When tagList / legacyTagList are passed, a case-insensitive match rewrites
 * the primary to the list spelling. Lists never drop an unlisted primary.
 */
export function normalizeTags(
  primary: unknown,
  extras: unknown = [],
  opts?: TagNormalizeOpts,
): NormalizeTagsResult {
  const extraList = Array.isArray(extras) ? extras : [];
  const rawPrimary = normalizePrimaryValue(primary);
  if (!rawPrimary) {
    return {tags: [], dropped: extraList.filter((item) => typeof item === 'string')};
  }

  const resolvedPrimary = canonicalPrimary(rawPrimary, opts);
  const seen = new Set([resolvedPrimary.toLowerCase()]);
  const tags = [resolvedPrimary];
  const dropped: string[] = [];

  for (const extra of extraList) {
    const original = typeof extra === 'string' ? extra : '';
    const normalised = normalizeExtraValue(extra);
    if (!normalised) {
      dropped.push(original);
      continue;
    }
    if (seen.has(normalised)) {
      dropped.push(original);
      continue;
    }
    if (tags.length >= TAG_LIMITS.maxTags) {
      dropped.push(original);
      continue;
    }
    seen.add(normalised);
    tags.push(normalised);
  }

  return {tags, dropped};
}

export function readTags(doc: TagDoc | null | undefined): string[] {
  if (!doc) {
    return [];
  }
  if (Array.isArray(doc.tags) && doc.tags.length > 0) {
    return normalizeTags(doc.tags[0], doc.tags.slice(1)).tags;
  }
  if (typeof doc.tag === 'string') {
    return normalizeTags(doc.tag, []).tags;
  }
  return [];
}

export function primaryTag(expense: TagDoc | null | undefined): string | null {
  return readTags(expense)[0] ?? null;
}

export function extraTags(expense: TagDoc | null | undefined): string[] {
  return readTags(expense).slice(1);
}

export function isUntagged(expense: TagDoc | null | undefined): boolean {
  return primaryTag(expense) == null;
}

export function withTags<T extends Partial<Expense>>(
  expense: T,
  tags: string[],
): T & {tags: string[]; tag: string | null} {
  const normalised = normalizeTags(tags[0], tags.slice(1)).tags;
  return {
    ...expense,
    tags: normalised,
    tag: normalised[0] ?? null,
  };
}

export function adaptExpense<T extends Partial<Expense>>(expense: T): T {
  return withTags(expense, readTags(expense));
}

export function normalizeDescription(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, TAG_LIMITS.maxDescription);
}

export function sameTag(left: unknown, right: unknown): boolean {
  const a = normalizePrimaryValue(left);
  const b = normalizePrimaryValue(right);
  if (!a || !b) {
    return false;
  }
  return a.toLowerCase() === b.toLowerCase();
}

export type TagListStatus = 'active' | 'retired' | 'unlisted' | null;

export function tagListStatus(
  tag: unknown,
  tagList: string[] = [],
  legacyTagList: string[] = [],
): TagListStatus {
  const primary = normalizePrimaryValue(tag);
  if (!primary) {
    return null;
  }
  const listed = (item: unknown) =>
    typeof item === 'string' && collapseWhitespace(item).toLowerCase() === primary.toLowerCase();
  if (tagList.some(listed)) {
    return 'active';
  }
  if (legacyTagList.some(listed)) {
    return 'retired';
  }
  return 'unlisted';
}

export function isListedTag(
  tag: unknown,
  tagList: string[] = [],
  legacyTagList: string[] = [],
): boolean {
  const status = tagListStatus(tag, tagList, legacyTagList);
  return status === 'active' || status === 'retired';
}

export function groupKey(tag: unknown): string | null {
  const primary = normalizePrimaryValue(tag);
  return primary ? primary.toLowerCase() : null;
}

export function displayTag(
  tag: unknown,
  tagList: string[] = [],
  legacyTagList: string[] = [],
): string | null {
  const primary = normalizePrimaryValue(tag);
  if (!primary) {
    return null;
  }
  return canonicalPrimary(primary, {tagList, legacyTagList});
}

export function isValidPrimary(
  tag: unknown,
  tagList: string[] = [],
  legacyTagList: string[] = [],
): boolean {
  return isListedTag(tag, tagList, legacyTagList);
}

export function isPersistedExpenseId(id: unknown): boolean {
  const existingId = typeof id === 'string' ? id.trim() : '';
  return Boolean(existingId && existingId !== 'manual');
}

export function withConfiguredTags<T extends Partial<Expense>>(
  expense: T,
  opts?: TagNormalizeOpts,
): T & {tags: string[]; tag: string | null} {
  return withTags(expense, normalizeTags(primaryTag(expense), extraTags(expense), opts).tags);
}

const DUPE_KEYS = ['duplicateOf', 'dupeCandidateOf', 'dupeStatus', 'dupeRule'] as const;

export type OwnedExpenseFields = {
  tags: string[];
  tag: string | null;
  cost: number;
  vendor: string;
  date: number;
  type: string;
  costType: Expense['costType'];
  operation: string;
  modifiedDate: number;
  enrichedAt?: number;
  description?: string | null;
  duplicateOf?: string | null;
  dupeCandidateOf?: string | null;
  dupeStatus?: Expense['dupeStatus'] | null;
  dupeRule?: string | null;
};

export function ownedExpenseFields(
  expense: Expense,
  source: Partial<Expense>,
): OwnedExpenseFields {
  const fields: OwnedExpenseFields = {
    tags: expense.tags || [],
    tag: expense.tag ?? null,
    cost: expense.cost,
    vendor: expense.vendor,
    date: expense.date,
    type: expense.type,
    costType: expense.costType,
    operation: expense.operation,
    modifiedDate: expense.modifiedDate,
  };
  if (Object.prototype.hasOwnProperty.call(source, 'enrichedAt')) {
    fields.enrichedAt = source.enrichedAt;
  }
  if (Object.prototype.hasOwnProperty.call(source, 'description')) {
    fields.description = normalizeDescription(source.description) ?? null;
  }
  const hasDupe = DUPE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(source, key));
  if (hasDupe) {
    fields.duplicateOf = source.duplicateOf ?? null;
    fields.dupeCandidateOf = source.dupeCandidateOf ?? null;
    fields.dupeStatus = source.dupeStatus ?? null;
    fields.dupeRule = source.dupeRule ?? null;
  }
  return fields;
}
