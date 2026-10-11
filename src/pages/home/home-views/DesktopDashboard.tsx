/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useMemo} from 'react';
import {Chip, Typography} from '@mui/material';
import dayjs from 'dayjs';
import {useSelector} from 'react-redux';
import {selectExpense} from '../../../store/expenseActions';
import {calculateBudgetProgress} from '../../budget/budgetMath';
import {budgetAlerts, currentMonthExpenses, summarizeMonth} from '../homeDashboardMath';
import './DesktopDashboard.scss';

const formatRupees = (amount: number): string =>
  `₹${Math.round(amount).toLocaleString('en-IN')}`;

const DesktopDashboard: React.FC = () => {
  const {expenseList, budgetList} = useSelector(selectExpense);
  const monthExpenses = useMemo(() => currentMonthExpenses(expenseList), [expenseList]);
  const summary = useMemo(() => summarizeMonth(monthExpenses), [monthExpenses]);
  const alerts = useMemo(
    () => budgetAlerts(calculateBudgetProgress(monthExpenses, budgetList)),
    [monthExpenses, budgetList],
  );

  return (
    <aside className="desktop-dashboard" aria-label="This month">
      <Typography variant="caption" className="dash-month">
        {dayjs().format('MMMM YYYY')}
      </Typography>

      <section className="dash-card dash-card-spent">
        <div className="dash-label">Spent</div>
        <div className="dash-amount">{formatRupees(summary.spent)}</div>
      </section>

      <section className="dash-card">
        <div className="dash-label">Received</div>
        <div className="dash-amount">{formatRupees(summary.received)}</div>
      </section>

      <section className="dash-card">
        <div className="dash-title">Top vendors</div>
        {summary.topVendors.length === 0 ? (
          <Typography variant="body2" color="text.secondary">None this month</Typography>
        ) : (
          summary.topVendors.map((vendor) => (
            <div className="dash-row" key={vendor.label}>
              <span className="dash-row-label">{vendor.label}</span>
              <span>{formatRupees(vendor.amount)}</span>
            </div>
          ))
        )}
      </section>

      <section className="dash-card">
        <div className="dash-title">Tags</div>
        {summary.tags.length === 0 ? (
          <Typography variant="body2" color="text.secondary">None this month</Typography>
        ) : (
          <div className="dash-tags">
            {summary.tags.map((tag) => (
              <Chip
                key={tag.label}
                size="small"
                variant="outlined"
                label={`${tag.label === 'Untagged' ? tag.label : tag.label.toLowerCase()} ${tag.percent}%`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dash-card">
        <div className="dash-title">Alerts</div>
        {alerts.length === 0 ? (
          <Typography variant="body2">None over 80%</Typography>
        ) : (
          alerts.map((alert) => (
            <div className="dash-row" key={alert.budget.id}>
              <span className="dash-row-label">{alert.budget.name}</span>
              <span>{Math.round(alert.percentage)}%</span>
            </div>
          ))
        )}
      </section>
    </aside>
  );
};

export default DesktopDashboard;
