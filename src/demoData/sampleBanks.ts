/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {BankEmailParsingEntry} from '../Types';

export const SAMPLE_BANKS: BankEmailParsingEntry[] = [
  {
    id: 'demo-hdfc',
    displayName: 'HDFC Bank',
    matchStrings: ['HDFC Bank', 'HDFCBK'],
  },
  {
    id: 'demo-sbi',
    displayName: 'SBI',
    matchStrings: ['State Bank of India', 'SBIINB'],
  },
];
