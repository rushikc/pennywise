/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {saveAs} from 'file-saver';
import {exportAsCSV, formatExpenses} from './exportReport';
import {makeExpense} from '../../testUtils';

jest.mock('file-saver', () => ({saveAs: jest.fn()}));

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

  it('keeps export columns in a stable order', () => {
    const [row] = formatExpenses([makeExpense()]);
    expect(Object.keys(row)).toEqual([
      'Date', 'Time', 'Vendor', 'Amount', 'Type', 'PaymentMode', 'Tag', 'Extra tags', 'Description', 'User',
    ]);
  });

  it('keeps a credit amount positive and records the type', () => {
    const [row] = formatExpenses([makeExpense({cost: 230, costType: 'credit'})]);
    expect(row.Amount).toBe(230);
    expect(row.Type).toBe('credit');
  });

  it('formats the date in the runner timezone, which is IST on this machine', () => {
    const stamp = Date.parse('2026-06-01T18:30:00.000Z');
    const [row] = formatExpenses([makeExpense({date: stamp})]);
    expect(row.Date).toBe(new Date(stamp).toLocaleDateString());
    expect(row.Time).toBe(new Date(stamp).toLocaleTimeString());
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata') {
      expect(new Date(stamp).toLocaleDateString('en-GB', {timeZone: 'Asia/Kolkata'})).toBe('02/06/2026');
    }
  });

  it('quotes commas, quotes, and newlines in the csv', async () => {
    exportAsCSV([makeExpense({
      vendor: 'Cafe, "Main"\nStreet',
      description: 'line\n"two"',
    })], '7d');
    const file = jest.mocked(saveAs).mock.calls.at(-1)?.[0] as Blob;
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
    expect(csv.split('\n')[0]).toContain('Date,Time,Vendor,Amount,Type,PaymentMode,Tag,Extra tags,Description,User');
    expect(csv).toContain('"Cafe, ""Main""');
    expect(csv).toContain('Street"');
    expect(csv).toContain('"line');
    expect(csv).toContain('""two"""');
  });

  it('does not download when the range is empty', () => {
    jest.mocked(saveAs).mockClear();
    exportAsCSV([], '7d');
    expect(saveAs).not.toHaveBeenCalled();
  });

  it('exports the list spelling for a listed primary', () => {
    const [row] = formatExpenses(
      [makeExpense({tags: ['Food']})],
      {tagList: ['food'], legacyTagList: []},
    );
    expect(row.Tag).toBe('food');
  });
});
