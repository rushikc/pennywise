/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {makeExpense} from '../../../testUtils';
import PhoneStatsHeader from './PhoneStatsHeader';

describe('PhoneStatsHeader', () => {
  it('shows spent and received for the selected range', () => {
    render(
      <PhoneStatsHeader
        expenses={[
          makeExpense({id: 'd1', cost: 150, costType: 'debit'}),
          makeExpense({id: 'c1', cost: 40, costType: 'credit'}),
        ]}
        rangeLabel="7 Days"
        days={7}
      />
    );

    expect(screen.getByText('7 Days spent')).toBeInTheDocument();
    expect(screen.getByText('₹150')).toBeInTheDocument();
    expect(screen.getByText('₹40')).toBeInTheDocument();
    expect(screen.getByText('2 expenses')).toBeInTheDocument();
  });
});
