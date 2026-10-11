/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {mergedCostAndType, signedExpenseTotal} from './mergeMath';

describe('merge math', () => {
  it('signs mixed debit and credit into an absolute cost and costType', () => {
    const total = signedExpenseTotal([
      {cost: 100, costType: 'debit'},
      {cost: 30, costType: 'credit'},
    ]);
    expect(total).toBe(-70);
    expect(mergedCostAndType(total)).toEqual({cost: 70, costType: 'debit'});
  });

  it('treats a non-negative total as credit', () => {
    expect(mergedCostAndType(40)).toEqual({cost: 40, costType: 'credit'});
    expect(mergedCostAndType(0)).toEqual({cost: 0, costType: 'credit'});
  });
});
