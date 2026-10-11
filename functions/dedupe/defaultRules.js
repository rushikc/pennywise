/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

/** Default dedupe ruleset; overridable via Firestore config/dedupeRules */
const defaultRules = {
  aliasGroups: [
    {entity: 'netflix', patterns: ['NETFLIX'], windowMinutes: 10},
    {entity: 'googleplay', patterns: ['GOOGLE\\s*PLAY', 'GOOGLEPLAY'], windowMinutes: 10},
    {entity: 'zee', patterns: ['ZEE\\s*ENTERTAINMENT', 'ZEEENTERTAINMENT'], windowMinutes: 10},
    {entity: 'youtube', patterns: ['YOUTUBE', 'YOUTUBEGOOGLE'], windowMinutes: 10},
    {entity: 'redbus', patterns: ['REDBUS'], windowMinutes: 10},
    {entity: 'gcloud', patterns: ['GOOGLE\\s*CLOUD', 'GOOGLECLOUD'], windowMinutes: 10},
  ],
  railGroups: [
    {
      group: 'invest',
      windowHours: 24,
      rails: {
        broker: ['INDSTOCKS\\.', 'INDMONEY'],
        exchange: ['^BSE', 'BSE STAR MF', 'MOTILAL OSWAL', 'INDEX FUND'],
        settlement: ['INDIAN CLEARING CORP', 'ICCL'],
      },
    },
  ],
  neverMerge: {
    sameVendorSameType: true,
    distinctTagPairs: [['rent', 'parents']],
    reviewWindowMinutes: 5,
  },
};

module.exports = {defaultRules};
