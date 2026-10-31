/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import type {CSSProperties, ReactNode} from 'react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {useIsDesktop} from '../../hooks/useIsDesktop';
import {makeExpense} from '../../testUtils';
import expenseReducer from '../../store/expenseSlice';
import Insights from './Insights';
import {vendorTableBodyHeight, vendorTableColumns} from './vendorTable';

type MockColumn = {title?: ReactNode};
type MockTableProps = {
  columns: MockColumn[];
  scroll?: {y?: number | string};
  pagination?: unknown;
  tableLayout?: string;
};

jest.mock('antd', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react');
  const Table = ({columns, scroll, pagination, tableLayout}: MockTableProps) => mockReact.createElement(
    'div',
    {
      className: 'ant-table-body',
      'data-pagination': String(pagination),
      'data-table-layout': tableLayout,
      style: {maxHeight: scroll?.y, overflowY: 'scroll'},
    },
    columns.map((column: MockColumn) => mockReact.createElement(
      'div',
      {key: column.title, role: 'columnheader'},
      column.title,
    )),
  );

  const passthrough = ({children}: {children?: ReactNode}) => mockReact.createElement('div', null, children);
  const Card = ({
    children,
    className,
    style,
  }: {children?: ReactNode; className?: string; style?: CSSProperties}) => mockReact.createElement(
    'section',
    {className, style},
    children,
  );
  return {
    Button: passthrough,
    Card,
    Col: passthrough,
    Row: passthrough,
    Select: () => null,
    Statistic: () => null,
    Table,
  };
});

jest.mock('../../components/Loading', () => ({default: () => null}));

jest.mock('@ant-design/icons', () => ({
  DownloadOutlined: () => null,
}));

jest.mock('./exportReport', () => ({
  exportAsCSV: jest.fn(),
  exportAsXLSX: jest.fn(),
}));

jest.mock('../../api/ExpenseAPI', () => ({
  ExpenseAPI: {getExpenseList: jest.fn()},
}));

jest.mock('../../hooks/useIsDesktop', () => ({
  useIsDesktop: jest.fn(),
}));

jest.mock('./Graph', () => ({
  LineGraph: () => null,
  PieGraph: () => null,
}));

const mockedGet = ExpenseAPI.getExpenseList as jest.Mock;
const mockedDesktop = useIsDesktop as jest.Mock;

const columnTitles = (desktopLayout: boolean) => {
  return vendorTableColumns(desktopLayout).map((column) => String(column.title));
};

describe('vendor table layout', () => {
  it('keeps Vendor, Count, and Spent on desktop at a 10-row body height', () => {
    expect(columnTitles(true)).toEqual(['Vendor', 'Count', 'Spent']);
    expect(vendorTableBodyHeight(true)).toBe(550);
    expect(vendorTableColumns(true)[0].ellipsis).toBeUndefined();
  });

  it('keeps Vendor and Spent on phone, with a narrower ellipsized vendor', () => {
    expect(columnTitles(false)).toEqual(['Vendor', 'Spent']);
    expect(vendorTableBodyHeight(false)).toBe(320);
    const [vendor, spent] = vendorTableColumns(false);
    expect(vendor.ellipsis).toBe(true);
    expect(spent.width).toBe(104);
    expect(spent.align).toBe('right');
  });
});

describe('Insights vendor table', () => {
  const vendors = Array.from({length: 12}, (_, index) => makeExpense({
    id: `exp-${index}`,
    vendor: `Vendor ${index}`,
    cost: 100 + index,
    date: Date.now(),
  }));

  const renderInsights = async (desktopLayout: boolean) => {
    mockedDesktop.mockReturnValue(desktopLayout);
    mockedGet.mockResolvedValue(vendors);
    const store = configureStore({
      reducer: {expense: expenseReducer},
    });
    render(
      <Provider store={store}>
        <Insights/>
      </Provider>,
    );
    expect(await screen.findByRole('columnheader', {name: 'Vendor'})).toBeVisible();
  };

  it('scrolls the table body on desktop and still shows Count', async () => {
    await renderInsights(true);
    expect(screen.getByRole('columnheader', {name: 'Count'})).toBeVisible();

    const body = document.querySelector('.insights-vendors .ant-table-body') as HTMLElement;
    expect(body.style.overflowY).toBe('scroll');
    expect(body.style.maxHeight).toBe(`${vendorTableBodyHeight(true)}px`);
    expect(body.dataset.pagination).toBe('false');
  });

  it('scrolls the table body on phone without Count', async () => {
    await renderInsights(false);
    expect(screen.queryByRole('columnheader', {name: 'Count'})).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', {name: 'Spent'})).toBeVisible();

    const body = document.querySelector('.insights-vendors .ant-table-body') as HTMLElement;
    expect(body.style.overflowY).toBe('scroll');
    expect(body.style.maxHeight).toBe(`${vendorTableBodyHeight(false)}px`);
    expect(body.dataset.tableLayout).toBe('fixed');
  });
});
