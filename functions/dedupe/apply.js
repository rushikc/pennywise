/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/**
 * Skip already-deleted or already-deduped docs from a scan.
 * @param {object} data
 * @returns {boolean}
 */
function shouldScanExpense(data) {
  if (!data) {
    return false;
  }
  if (data.operation === 'delete') {
    return false;
  }
  if (data.duplicateOf || data.dupeStatus) {
    return false;
  }
  return true;
}

/**
 * Write inherited tag onto keep only when keep has none.
 * @param {object} keep
 * @param {string|undefined} inheritedTag
 * @returns {boolean}
 */
const {readTags, normalizeDescription} = require('../lib/parse/tags');

function tagsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function shouldWriteKeepTags(keep, merged) {
  if (!keep || !merged) {
    return false;
  }
  const current = readTags(keep);
  const nextTags = Array.isArray(merged.tags) ? merged.tags : [];
  if (!tagsEqual(current, nextTags) && nextTags.length > 0) {
    return true;
  }
  const nextDescription = merged.description;
  if (nextDescription && nextDescription !== normalizeDescription(keep.description)) {
    return true;
  }
  return false;
}

function shouldWriteKeepTag(keep, inheritedTag) {
  return shouldWriteKeepTags(keep, {tags: inheritedTag ? [inheritedTag] : []});
}

/**
 * Review-tier survivor: earlier date, tie keeps `a` (no id tie-break).
 * @param {object} a
 * @param {object} b
 * @returns {{keep: object, drop: object}}
 */
function pickReviewSurvivor(a, b) {
  if (a.date <= b.date) {
    return {keep: a, drop: b};
  }
  return {keep: b, drop: a};
}

/**
 * Overlay Firestore config on defaults.
 * @param {object} defaults
 * @param {object} [override]
 * @returns {object}
 */
function mergeRuleset(defaults, override) {
  if (!override) {
    return defaults;
  }
  return {...defaults, ...override};
}

module.exports = {
  shouldScanExpense,
  shouldWriteKeepTag,
  shouldWriteKeepTags,
  pickReviewSurvivor,
  mergeRuleset,
};
