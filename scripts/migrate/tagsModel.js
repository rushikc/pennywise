/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

function loadTags() {
  try {
    return require('../../functions/lib/parse/tags');
  } catch (error) {
    throw new Error(
      'Run `npm run build --prefix functions` first so functions/lib/parse/tags.js exists.',
    );
  }
}

function migrateExpenseDoc(doc) {
  const {readTags} = loadTags();
  const source = doc && typeof doc === 'object' ? doc : {};
  const tags = readTags(source);
  const mirror = tags[0] ?? null;
  const sameTags = Array.isArray(source.tags) && JSON.stringify(source.tags) === JSON.stringify(tags);
  const sameMirror = (source.tag === undefined ? null : source.tag) === mirror
    || (source.tag === null && mirror === null);
  const changed = !(sameTags && sameMirror);
  return {
    changed,
    next: {
      ...source,
      tags,
      tag: mirror,
    },
  };
}

function computeLegacyTags(expenses, vendorTags, budgets, tagList) {
  const {primaryTag} = loadTags();
  const allowed = new Set(
    (tagList || [])
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== 'all'),
  );
  const allowedLower = new Set([...allowed].map((item) => item.toLowerCase()));
  const used = new Set();
  const add = (value) => {
    if (typeof value !== 'string') {
      return;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'all') {
      return;
    }
    used.add(trimmed);
  };
  for (const expense of expenses || []) {
    const primary = primaryTag(expense);
    if (primary) {
      used.add(primary);
    }
  }
  for (const vendorTag of vendorTags || []) {
    add(vendorTag && vendorTag.tag);
  }
  for (const budget of budgets || []) {
    for (const tag of (budget && budget.tagList) || []) {
      add(tag);
    }
  }
  return [...used]
    .filter((tag) => !allowedLower.has(tag.toLowerCase()))
    .sort();
}

function countMailIdCollisions(expenses) {
  const counts = new Map();
  for (const expense of expenses || []) {
    const mailId = expense && expense.mailId;
    if (!mailId) {
      continue;
    }
    counts.set(mailId, (counts.get(mailId) || 0) + 1);
  }
  let collidingDocs = 0;
  for (const count of counts.values()) {
    if (count > 1) {
      collidingDocs += count;
    }
  }
  return collidingDocs;
}

module.exports = {
  loadTags,
  migrateExpenseDoc,
  computeLegacyTags,
  countMailIdCollisions,
};
