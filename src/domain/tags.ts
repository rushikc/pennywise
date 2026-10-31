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

/** Case- and whitespace-insensitive key used to match vendors to vendorTags. */
export function vendorKey(vendor: unknown): string {
  return typeof vendor === 'string' ? vendor.trim().toUpperCase() : '';
}

export function isPersistedExpenseId(id: unknown): boolean {
  const existingId = typeof id === 'string' ? id.trim() : '';
  return Boolean(existingId && existingId !== 'manual');
}

const DUPE_KEYS = ['duplicateOf', 'dupeCandidateOf', 'dupeStatus', 'dupeRule'] as const;

export type ExpenseEdit = {
  primary?: string | null;
  addExtras?: string[];
  removeExtras?: string[];
  description?: string | null;
  cost?: number;
  vendor?: string;
  costType?: Expense['costType'];
  date?: number;
  type?: string;
  operation?: string;
  dupe?: {
    duplicateOf?: string | null;
    dupeCandidateOf?: string | null;
    dupeStatus?: Expense['dupeStatus'] | null;
    dupeRule?: string | null;
  };
};

export function applyExpenseEdit<T extends Partial<Expense>>(
  server: T,
  edit: ExpenseEdit,
): {next: T; patch: Record<string, unknown>} {
  const modifiedDate = Date.now();
  const next: T = {...server, modifiedDate};
  const patch: Record<string, unknown> = {modifiedDate};

  const writeTags = edit.primary !== undefined
    || edit.addExtras !== undefined
    || edit.removeExtras !== undefined;
  if (writeTags) {
    const primary = edit.primary !== undefined ? edit.primary : primaryTag(server);
    let extras = extraTags(server);
    if (edit.removeExtras) {
      const removeExtras = edit.removeExtras;
      extras = extras.filter((tag) => !removeExtras.some((item) => sameTag(item, tag)));
    }
    if (edit.addExtras) {
      extras = [...extras, ...edit.addExtras];
    }
    Object.assign(next, withTags(next, normalizeTags(primary, extras).tags));
    patch.tags = next.tags;
    patch.tag = next.tag ?? null;
  }

  if (edit.description !== undefined) {
    const note = normalizeDescription(edit.description);
    if (note) {
      next.description = note;
      patch.description = note;
    } else {
      delete next.description;
      patch.description = null;
    }
  }

  if (edit.cost !== undefined) {
    const cost = Number(Number(edit.cost).toFixed(2));
    next.cost = cost;
    patch.cost = cost;
  }
  if (edit.vendor !== undefined) {
    next.vendor = edit.vendor;
    patch.vendor = edit.vendor;
  }
  if (edit.costType !== undefined) {
    next.costType = edit.costType;
    patch.costType = edit.costType;
  }
  if (edit.date !== undefined) {
    next.date = edit.date;
    patch.date = edit.date;
  }
  if (edit.type !== undefined) {
    next.type = edit.type;
    patch.type = edit.type;
  }
  if (edit.operation !== undefined) {
    next.operation = edit.operation;
    patch.operation = edit.operation;
  }

  if (edit.dupe) {
    for (const key of DUPE_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(edit.dupe, key)) {
        continue;
      }
      const value = edit.dupe[key];
      if (value == null) {
        delete next[key];
        patch[key] = null;
      } else {
        (next as Expense)[key] = value as never;
        patch[key] = value;
      }
    }
  }

  return {next, patch};
}
