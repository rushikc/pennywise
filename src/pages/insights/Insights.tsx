/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Chip, Container, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import {Button, Card, Col, Row, Select, Statistic, Table} from 'antd';
import {DownloadOutlined} from '@ant-design/icons';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {sortByKey} from '../../utility/utility';
import {exportAsCSV, exportAsXLSX} from './exportReport';
import {LineGraph, PieGraph} from './Graph';
import Loading from '../../components/Loading';
import {
  CalculationOption,
  calculationOptions,
  DateRange,
  filterOptions,
  GroupByOption,
  groupByOptions,
} from '../dataValidations';
import '../home/Home.scss';
import './Insights.scss';
import {Expense} from '../../Types';
import {useIsDesktop} from '../../hooks/useIsDesktop';
import {desktop, phone} from '../../styles/designTokens';
import {
  dailyFigure,
  dailyTrend,
  distributionSlices,
  expensesInRange,
  formatInr,
  monthlyFigure,
  periodChange,
  sumCost,
  topVendors,
} from './insightsMath';
import type {VendorRow} from './insightsMath';
import {vendorTableBodyHeight, vendorTableColumns} from './vendorTable';

const Insights: React.FC = () => {
  const isDesktop = useIsDesktop();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<DateRange>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [showGroupByOptions, setShowGroupByOptions] = useState(false);
  const groupByPanelRef = useRef<HTMLDivElement>(null);
  const groupByButtonRef = useRef<HTMLDivElement>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState<GroupByOption>('days');
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationOption>('median');
  const [showSelectionPanel, setShowSelectionPanel] = useState(false);
  const selectionPanelRef = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const expenseResult = await ExpenseAPI.getExpenseList();
        setExpenses(sortByKey(expenseResult, 'date'));
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchExpenses();
  }, []);

  const filtered = useMemo(() => expensesInRange(expenses, timeRange), [expenses, timeRange]);
  const spending = sumCost(filtered);
  const daily = dailyFigure(filtered, timeRange, selectedCalculation);
  const monthly = monthlyFigure(filtered, timeRange, selectedCalculation);
  const change = periodChange(expenses, timeRange);
  const trend = dailyTrend(filtered);
  const slices = distributionSlices(filtered, selectedGroupBy);
  const chartSlices = !isDesktop && selectedItems.length > 0
    ? slices.filter((slice) => selectedItems.includes(slice.name))
    : slices;
  const vendors = topVendors(filtered);
  const vendorBodyHeight = vendorTableBodyHeight(isDesktop);
  const vendorColumns = vendorTableColumns(isDesktop);
  const figureWord = selectedCalculation === 'average' ? 'average' : 'median';

  const getCostRange = useCallback((cost: number): string => {
    if (cost <= 100) return '₹0-₹100';
    if (cost <= 500) return '₹100-₹500';
    if (cost <= 1000) return '₹500-₹1000';
    return '₹1000+';
  }, []);

  const getAvailableItems = useCallback((rows: Expense[], groupBy: GroupByOption): string[] => {
    if (groupBy === 'days') return [];

    const getGroupKey = (expense: Expense): string => {
      if (groupBy === 'vendor') return expense.vendor;
      if (groupBy === 'tags') return expense.tag || 'Untagged';
      if (groupBy === 'cost') return getCostRange(expense.cost);
      return '';
    };

    const groupMetrics = new Map<string, number>();
    rows.forEach((expense) => {
      const groupKey = getGroupKey(expense);
      if (groupKey) {
        groupMetrics.set(groupKey, (groupMetrics.get(groupKey) || 0) + Number(expense.cost));
      }
    });

    let uniqueGroups = Array.from(groupMetrics.keys());
    uniqueGroups.sort((a, b) => (groupMetrics.get(b) || 0) - (groupMetrics.get(a) || 0));
    if (groupBy === 'tags') {
      uniqueGroups = uniqueGroups.filter((group) => group !== 'Untagged');
    }
    return uniqueGroups;
  }, [getCostRange]);

  useEffect(() => {
    if (selectedGroupBy === 'days') {
      setAvailableItems([]);
      setSelectedItems([]);
      return;
    }
    const items = getAvailableItems(filtered, selectedGroupBy);
    setAvailableItems(items);
    if (selectedItems.length === 0 && items.length > 0) {
      setSelectedItems(items.slice(0, 5));
    }
  }, [selectedGroupBy, expenses, timeRange, getAvailableItems, selectedItems.length, filtered]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (showGroupByOptions) setShowGroupByOptions(false);
    if (showSelectionPanel) setShowSelectionPanel(false);
  };

  const toggleGroupByOptions = () => {
    setShowGroupByOptions(!showGroupByOptions);
    if (showFilters) setShowFilters(false);
    if (showSelectionPanel) setShowSelectionPanel(false);
  };

  const toggleSelectionPanel = () => {
    setShowSelectionPanel(!showSelectionPanel);
    if (showFilters) setShowFilters(false);
    if (showGroupByOptions) setShowGroupByOptions(false);
  };

  if (isLoading) {
    return <Loading/>;
  }

  const percentValue = change.percent === null ? '—' : `${Math.round(change.percent)} %`;

  return (
    <Container
      maxWidth={isDesktop ? false : 'sm'}
      className={`statistics-container insights-page${isDesktop ? ' insights-page--desktop' : ' insights-page--phone'}`}
    >
      <h1 className="insights-title">Insights</h1>

      {isDesktop && (
        <div className="insights-filters">
          <Select
            value={timeRange}
            options={filterOptions.map((option) => ({value: option.id, label: option.label}))}
            onChange={(value) => setTimeRange(value)}
          />
          <Select
            value={selectedGroupBy}
            options={groupByOptions.map((option) => ({value: option.id, label: option.label}))}
            onChange={(value) => {
              setSelectedGroupBy(value);
              setSelectedItems([]);
            }}
          />
          <Select
            value={selectedCalculation}
            options={calculationOptions.map((option) => ({value: option.id, label: option.label}))}
            onChange={(value) => setSelectedCalculation(value)}
          />
        </div>
      )}

      <Row gutter={isDesktop ? desktop.space.lg : [phone.space.lg, phone.space.lg]}>
        <Col span={isDesktop ? 6 : 24}>
          <Card className="insights-stat-card">
            <Statistic title={isDesktop ? 'Spending' : 'Total spending'} value={formatInr(spending)}/>
          </Card>
        </Col>
        <Col span={isDesktop ? 6 : 12}>
          <Card className="insights-stat-card">
            <Statistic title={`Daily ${figureWord}`} value={formatInr(daily)}/>
          </Card>
        </Col>
        <Col span={isDesktop ? 6 : 12}>
          <Card className="insights-stat-card">
            <Statistic title={`Monthly ${figureWord}`} value={formatInr(monthly)}/>
          </Card>
        </Col>
        <Col span={isDesktop ? 6 : 24}>
          <Card className="insights-stat-card">
            <Statistic
              title={change.label}
              value={percentValue}
              valueStyle={{color: change.percent !== null && change.percent < 0 ? 'var(--stat-negative)' : undefined}}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={isDesktop ? desktop.space.lg : [phone.space.lg, phone.space.lg]} className="insights-section">
        <Col span={isDesktop ? 14 : 24}>
          <LineGraph data={trend}/>
        </Col>
        <Col span={isDesktop ? 10 : 24}>
          <PieGraph
            data={chartSlices}
            onSelectionToggle={isDesktop ? undefined : toggleSelectionPanel}
          />
        </Col>
      </Row>

      <Card
        title="Top vendors"
        className="insights-section insights-vendors"
        style={{'--vendor-body-height': `${vendorBodyHeight}px`} as React.CSSProperties}
      >
        <Table<VendorRow>
          rowKey="vendor"
          dataSource={vendors}
          pagination={false}
          tableLayout={isDesktop ? 'auto' : 'fixed'}
          scroll={{y: vendorBodyHeight}}
          columns={vendorColumns}
        />
      </Card>

      <div className="insights-export">
        <Button icon={<DownloadOutlined/>} onClick={() => exportAsXLSX(filtered, timeRange)}>
          Export XLSX
        </Button>
        <Button icon={<DownloadOutlined/>} onClick={() => exportAsCSV(filtered, timeRange)}>
          Export CSV
        </Button>
      </div>

      {!isDesktop && (
        <>
          <div className="buttons-container">
            <div className="filter-button" ref={filterButtonRef} onClick={toggleFilters}>
              <Chip
                icon={<FilterListIcon/>}
                label={filterOptions.find((option) => option.id === timeRange)?.label}
                clickable
                color="primary"
              />
            </div>
            <div className="group-by-button" ref={groupByButtonRef} onClick={toggleGroupByOptions}>
              <Chip
                icon={<SortIcon/>}
                label={`Group: ${groupByOptions.find((option) => option.id === selectedGroupBy)?.label}`}
                clickable
                color="primary"
              />
            </div>
          </div>

          <FilterPanel
            show={showFilters}
            onClose={() => setShowFilters(false)}
            selectedRange={timeRange}
            onRangeChange={(range) => {
              setTimeRange(range);
              setShowFilters(false);
            }}
            panelRef={filterPanelRef}
          />
          <GroupByPanel
            show={showGroupByOptions}
            onClose={() => setShowGroupByOptions(false)}
            selectedGroupBy={selectedGroupBy}
            selectedCalculation={selectedCalculation}
            onGroupByChange={(option) => {
              setSelectedGroupBy(option);
              setShowGroupByOptions(false);
              setSelectedItems([]);
            }}
            onCalculationChange={(option) => {
              setSelectedCalculation(option);
              setShowGroupByOptions(false);
            }}
            panelRef={groupByPanelRef}
          />
          <SelectionPanel
            show={showSelectionPanel}
            onClose={() => setShowSelectionPanel(false)}
            selectedItems={selectedItems}
            onItemsChange={setSelectedItems}
            availableItems={availableItems}
            panelRef={selectionPanelRef}
          />
        </>
      )}
    </Container>
  );
};

export default Insights;

const FilterPanel: React.FC<{
  show: boolean;
  onClose: () => void;
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedRange, onRangeChange, panelRef}) => {
  if (!show) return null;
  return (
    <div className="filter-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Filter by date range</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="filter-options">
        {filterOptions.map(option => (
          <Chip
            key={option.id}
            label={option.label}
            color="primary"
            variant={selectedRange === option.id ? 'filled' : 'outlined'}
            onClick={() => onRangeChange(option.id)}
            className="filter-chip"
          />
        ))}
      </div>
    </div>
  );
};

const GroupByPanel: React.FC<{
  show: boolean;
  onClose: () => void;
  selectedGroupBy: GroupByOption;
  selectedCalculation: CalculationOption;
  onGroupByChange: (o: GroupByOption) => void;
  onCalculationChange: (o: CalculationOption) => void;
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedGroupBy, selectedCalculation, onGroupByChange, onCalculationChange, panelRef}) => {
  if (!show) return null;
  return (
    <div className="group-by-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Insights Options</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="panel-section">
        <div className="section-title">Group by</div>
        <div className="group-by-options">
          {groupByOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedGroupBy === option.id ? 'filled' : 'outlined'}
              onClick={() => onGroupByChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
      <div className="panel-section">
        <div className="section-title">Calculation</div>
        <div className="group-by-options">
          {calculationOptions.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              color="primary"
              variant={selectedCalculation === option.id ? 'filled' : 'outlined'}
              onClick={() => onCalculationChange(option.id)}
              className="filter-chip"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SelectionPanel: React.FC<{
  show: boolean;
  onClose: () => void;
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  availableItems: string[];
  panelRef: React.RefObject<HTMLDivElement>;
}> = ({show, onClose, selectedItems, onItemsChange, availableItems, panelRef}) => {
  if (!show) return null;

  const handleItemToggle = (item: string) => {
    if (selectedItems.includes(item)) {
      onItemsChange(selectedItems.filter(i => i !== item));
    } else {
      onItemsChange([...selectedItems, item]);
    }
  };

  return (
    <div className="selection-panel" ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">Select Items</span>
        <IconButton size="small" className="close-button" onClick={onClose}>
          <CloseIcon/>
        </IconButton>
      </div>
      <div className="selection-options">
        {availableItems.map(item => (
          <Chip
            key={item}
            label={item}
            color={selectedItems.includes(item) ? 'primary' : 'default'}
            variant={selectedItems.includes(item) ? 'filled' : 'outlined'}
            onClick={() => handleItemToggle(item)}
            className="selection-chip"
          />
        ))}
      </div>
    </div>
  );
};
