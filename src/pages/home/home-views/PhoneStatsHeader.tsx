/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React from 'react';
import {Expense} from '../../../Types';
import {rangeStats} from '../homeDashboardMath';
import './PhoneStatsHeader.scss';

interface PhoneStatsHeaderProps {
  expenses: Expense[];
  rangeLabel: string;
  days: number;
}

const formatRupees = (amount: number): string => {
  const rounded = Math.round(amount);
  const body = `₹${Math.abs(rounded).toLocaleString('en-IN')}`;
  return rounded < 0 ? `-${body}` : body;
};

const PhoneStatsHeader: React.FC<PhoneStatsHeaderProps> = ({expenses, rangeLabel, days}) => {
  const stats = rangeStats(expenses, days);
  const countLabel = stats.count === 1 ? '1 expense' : `${stats.count} expenses`;

  return (
    <section className="phone-stats" aria-label="Spending summary">
      <div className="phone-stats-caption">{rangeLabel} spent</div>
      <div className="phone-stats-amount">{formatRupees(stats.spent)}</div>
      <div className="phone-stats-count">{countLabel}</div>
      <div className="phone-stats-row">
        <div>
          <div className="phone-stats-metric-label">Received</div>
          <div className="phone-stats-metric-value positive">{formatRupees(stats.received)}</div>
        </div>
        <div>
          <div className="phone-stats-metric-label">Net</div>
          <div className={`phone-stats-metric-value${stats.net >= 0 ? ' positive' : ''}`}>
            {formatRupees(stats.net)}
          </div>
        </div>
        <div>
          <div className="phone-stats-metric-label">Avg / day</div>
          <div className="phone-stats-metric-value">{formatRupees(stats.avgPerDay)}</div>
        </div>
      </div>
    </section>
  );
};

export default PhoneStatsHeader;
