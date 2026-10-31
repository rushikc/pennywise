/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {formatExpenses} from './exportReport';
import {makeExpense} from '../../testUtils';

describe('formatExpenses', () => {
  it('exports primary, extras, and description columns', () => {
    const [row] = formatExpenses([makeExpense({
      tags: ['food', 'zomato', 'online food ordering'],
      tag: 'food',
      description: 'rare treat',
    })]);
    expect(row.Tag).toBe('food');
    expect(row['Extra tags']).toBe('zomato; online food ordering');
    expect(row.Description).toBe('rare treat');
  });

  it('uses Untagged when there is no primary', () => {
    const [row] = formatExpenses([makeExpense({tags: [], tag: null})]);
    expect(row.Tag).toBe('Untagged');
    expect(row['Extra tags']).toBe('');
  });

  it('exports the list spelling for a listed primary', () => {
    const [row] = formatExpenses(
      [makeExpense({tags: ['Food']})],
      {tagList: ['food'], legacyTagList: []},
    );
    expect(row.Tag).toBe('food');
  });
});
