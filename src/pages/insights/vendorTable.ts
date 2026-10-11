/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import type {TableColumnsType} from 'antd';
import {formatInr} from './insightsMath';
import type {VendorRow} from './insightsMath';

/** Body height for 10 vendor rows. Desktop matches the default table row; phone rows are shorter. */
export const vendorTableBodyHeight = (desktopLayout: boolean): number => {
  const rowHeight = desktopLayout ? 55 : 32;
  return rowHeight * 10;
};

export const vendorTableColumns = (desktopLayout: boolean): TableColumnsType<VendorRow> => {
  const spent = {
    title: 'Spent',
    dataIndex: 'spent',
    width: desktopLayout ? 160 : 104,
    align: 'right' as const,
    render: (amount: number) => formatInr(amount),
  };

  if (desktopLayout) {
    return [
      {title: 'Vendor', dataIndex: 'vendor'},
      {title: 'Count', dataIndex: 'count', width: 120, align: 'right'},
      spent,
    ];
  }

  return [
    {title: 'Vendor', dataIndex: 'vendor', ellipsis: true},
    spent,
  ];
};
