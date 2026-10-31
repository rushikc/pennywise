/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/* eslint-disable */

const {defaultRules} = require('./defaultRules');
const {primaryTag, extraTags, normalizeTags, normalizeDescription, readTags, sameTag} = require('../lib/parse/tags');

/**
 * @typedef {object} Expense
 * @property {string} id
 * @property {number} cost
 * @property {number} date
 * @property {string} vendor
 * @property {string} [type]
 * @property {string} [tag]
 * @property {string} [costType]
 */

/**
 * @typedef {object} DupePair
 * @property {string} rule
 * @property {Expense} keep
 * @property {Expense} drop
 * @property {number} deltaMinutes
 * @property {string} confidence
 */

/**
 * @typedef {object} ReviewCandidate
 * @property {string} reason
 * @property {Expense} a
 * @property {Expense} b
 * @property {number} deltaMinutes
 */

/**
 * @param {string} vendor
 * @param {string} pattern
 * @returns {boolean}
 */
function vendorMatchesPattern(vendor, pattern) {
  const normalized = String(vendor || '').toUpperCase();
  try {
    return new RegExp(pattern, 'i').test(normalized);
  } catch (_e) {
    return normalized.includes(String(pattern).toUpperCase());
  }
}

/**
 * @param {string} vendor
 * @param {string[]} patterns
 * @returns {boolean}
 */
function vendorMatchesAny(vendor, patterns) {
  return patterns.some((pattern) => vendorMatchesPattern(vendor, pattern));
}

/**
 * @param {Expense} expense
 * @param {object} ruleset
 * @returns {string|null}
 */
function resolveAliasEntity(expense, ruleset) {
  for (const group of ruleset.aliasGroups || []) {
    if (vendorMatchesAny(expense.vendor, group.patterns || [])) {
      return group.entity;
    }
  }
  return null;
}

/**
 * @param {Expense} expense
 * @param {object} railGroup
 * @returns {string|null}
 */
function resolveRail(expense, railGroup) {
  for (const [railName, patterns] of Object.entries(railGroup.rails || {})) {
    if (vendorMatchesAny(expense.vendor, patterns)) {
      return railName;
    }
  }
  return null;
}

/**
 * @param {Expense} a
 * @param {Expense} b
 * @param {object} neverMerge
 * @returns {boolean}
 */
function violatesDistinctTags(a, b, neverMerge) {
  const tagA = primaryTag(a);
  const tagB = primaryTag(b);
  if (!tagA || !tagB || sameTag(tagA, tagB)) {
    return false;
  }
  for (const pair of neverMerge.distinctTagPairs || []) {
    const [t1, t2] = pair;
    if (
      (sameTag(tagA, t1) && sameTag(tagB, t2)) ||
      (sameTag(tagA, t2) && sameTag(tagB, t1))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Expense} a
 * @param {Expense} b
 * @returns {boolean}
 */
function sameVendor(a, b) {
  return String(a.vendor || '').trim().toUpperCase() ===
    String(b.vendor || '').trim().toUpperCase();
}

/**
 * Deterministic survivor: earliest date, tie-break on id.
 * @param {Expense} a
 * @param {Expense} b
 * @returns {{keep: Expense, drop: Expense}}
 */
function pickSurvivor(a, b) {
  if (a.date < b.date) {
    return {keep: a, drop: b};
  }
  if (b.date < a.date) {
    return {keep: b, drop: a};
  }
  if (String(a.id) <= String(b.id)) {
    return {keep: a, drop: b};
  }
  return {keep: b, drop: a};
}

/**
 * @param {Set<string>} matchedIds
 * @param {Expense} a
 * @param {Expense} b
 * @returns {boolean}
 */
function canPair(matchedIds, a, b) {
  if (a.id === b.id) {
    return false;
  }
  if (matchedIds.has(a.id) || matchedIds.has(b.id)) {
    return false;
  }
  if (Number(a.cost) !== Number(b.cost)) {
    return false;
  }
  return true;
}

/**
 * @param {Expense[]} expenses
 * @param {object} [rulesetOverride]
 * @returns {{ pairs: DupePair[], needsReview: ReviewCandidate[] }}
 */
function detect(expenses, rulesetOverride) {
  const ruleset = rulesetOverride || defaultRules;
  const neverMerge = ruleset.neverMerge || {};
  const pairs = [];
  const needsReview = [];
  const matchedIds = new Set();

  const active = (expenses || []).filter((e) => e && e.id);

  // --- Tier 1: alias groups (1:1 greedy) ---
  for (const group of ruleset.aliasGroups || []) {
    const windowMs = (group.windowMinutes || 10) * 60 * 1000;
    const buckets = new Map();

    for (const exp of active) {
      if (matchedIds.has(exp.id)) {
        continue;
      }
      if (resolveAliasEntity(exp, ruleset) !== group.entity) {
        continue;
      }
      const key = Number(exp.cost);
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(exp);
    }

    for (const items of buckets.values()) {
      items.sort((x, y) => x.date - y.date || String(x.id).localeCompare(String(y.id)));
      for (let i = 0; i < items.length; i++) {
        const a = items[i];
        if (matchedIds.has(a.id)) {
          continue;
        }
        for (let j = i + 1; j < items.length; j++) {
          const b = items[j];
          if (matchedIds.has(b.id)) {
            continue;
          }
          if (b.date - a.date > windowMs) {
            break;
          }
          if (!canPair(matchedIds, a, b)) {
            continue;
          }
          if (violatesDistinctTags(a, b, neverMerge)) {
            continue;
          }
          if (sameVendor(a, b) && a.type === b.type && neverMerge.sameVendorSameType) {
            continue;
          }
          const {keep, drop} = pickSurvivor(a, b);
          matchedIds.add(keep.id);
          matchedIds.add(drop.id);
          pairs.push({
            rule: `alias:${group.entity}`,
            keep,
            drop,
            deltaMinutes: Math.round((drop.date - keep.date) / 60000),
            confidence: 'high',
          });
          break;
        }
      }
    }
  }

  // --- Tier 2: cross-rail (1:1 bipartite between distinct rails) ---
  for (const railGroup of ruleset.railGroups || []) {
    const windowMs = (railGroup.windowHours || 24) * 60 * 60 * 1000;
    const buckets = new Map();

    for (const exp of active) {
      if (matchedIds.has(exp.id)) {
        continue;
      }
      const rail = resolveRail(exp, railGroup);
      if (!rail) {
        continue;
      }
      const key = Number(exp.cost);
      if (!buckets.has(key)) {
        buckets.set(key, new Map());
      }
      const railMap = buckets.get(key);
      if (!railMap.has(rail)) {
        railMap.set(rail, []);
      }
      railMap.get(rail).push(exp);
    }

    for (const railMap of buckets.values()) {
      const railNames = [...railMap.keys()];
      for (let ri = 0; ri < railNames.length; ri++) {
        for (let rj = ri + 1; rj < railNames.length; rj++) {
          const railA = railNames[ri];
          const railB = railNames[rj];
          const listA = [...(railMap.get(railA) || [])].sort(
              (x, y) => x.date - y.date || String(x.id).localeCompare(String(y.id)),
          );
          const listB = [...(railMap.get(railB) || [])].sort(
              (x, y) => x.date - y.date || String(x.id).localeCompare(String(y.id)),
          );
          const usedB = new Set();

          for (const a of listA) {
            if (matchedIds.has(a.id)) {
              continue;
            }
            let bestB = null;
            let bestDelta = Infinity;
            for (const b of listB) {
              if (usedB.has(b.id) || matchedIds.has(b.id)) {
                continue;
              }
              if (Number(a.cost) !== Number(b.cost)) {
                continue;
              }
              const delta = Math.abs(b.date - a.date);
              if (delta > windowMs) {
                continue;
              }
              if (violatesDistinctTags(a, b, neverMerge)) {
                continue;
              }
              if (delta < bestDelta) {
                bestDelta = delta;
                bestB = b;
              }
            }
            if (bestB) {
              usedB.add(bestB.id);
              const {keep, drop} = pickSurvivor(a, bestB);
              matchedIds.add(keep.id);
              matchedIds.add(drop.id);
              pairs.push({
                rule: `rail:${railGroup.group}`,
                keep,
                drop,
                deltaMinutes: Math.round(Math.abs(drop.date - keep.date) / 60000),
                confidence: 'high',
              });
            }
          }
        }
      }
    }
  }

  // --- Tier 3: needs review (never auto-merge) ---
  const reviewWindowMs = (neverMerge.reviewWindowMinutes || 5) * 60 * 1000;

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (matchedIds.has(a.id) || matchedIds.has(b.id)) {
        continue;
      }
      if (Number(a.cost) !== Number(b.cost)) {
        continue;
      }
      const delta = Math.abs(b.date - a.date);
      if (delta > reviewWindowMs) {
        continue;
      }
      if (violatesDistinctTags(a, b, neverMerge)) {
        continue;
      }

      let reason = null;
      if (neverMerge.sameVendorSameType && sameVendor(a, b) && a.type === b.type) {
        reason = 'sameVendorSameType';
      } else if (!sameVendor(a, b)) {
        reason = 'sameCostNearTime';
      }

      if (reason) {
        needsReview.push({
          reason,
          a,
          b,
          deltaMinutes: Math.round(delta / 60000),
        });
      }
    }
  }

  return {pairs, needsReview};
}

/**
 * Tag inheritance for survivor when applying merge.
 * @param {Expense} keep
 * @param {Expense} drop
 * @returns {string|undefined}
 */
function mergedTags(keep, drop) {
  const primary = primaryTag(keep) || primaryTag(drop);
  const {tags} = normalizeTags(primary, [...extraTags(keep), ...extraTags(drop)]);
  const description = normalizeDescription(keep && keep.description) ||
    normalizeDescription(drop && drop.description);
  const result = {tags};
  if (description) {
    result.description = description;
  }
  return result;
}

function mergedTag(keep, drop) {
  return mergedTags(keep, drop).tags[0];
}

module.exports = {
  detect,
  mergedTag,
  mergedTags,
  vendorMatchesPattern,
  resolveAliasEntity,
  resolveRail,
  pickSurvivor,
  violatesDistinctTags,
  defaultRules,
};
