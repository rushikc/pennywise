/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {Expense} from '../../Types';
import {Workbook} from 'exceljs';
import {saveAs} from 'file-saver';
import {filterOptions} from '../dataValidations';
import {getCurrentDate} from '../../utility/utility';
import {json2csv} from 'json-2-csv';

/**
 * Represents a formatted expense record for export
 */
interface FormattedExpense {
  Date: string;
  Time: string;
  Vendor: string;
  Amount: number;
  Type: string;
  PaymentMode: string;
  Tag: string;
  User: string;
}

/**
 * Validates if the expense data can be exported
 * @param expenses List of expenses to validate
 * @returns true if expenses can be exported, false otherwise
 */
const validateExpenses = (expenses: Expense[]): boolean => {
  if (!expenses || expenses.length === 0) {
    console.warn('No expense data to export');
    return false;
  }
  return true;
};

/**
 * Formats raw expense data for export
 * @param expenses List of expenses to format
 * @returns Formatted expenses
 */
const formatExpenses = (expenses: Expense[]): FormattedExpense[] => {
  return expenses.map(expense => ({
    Date: new Date(expense.date).toLocaleDateString(),
    Time: new Date(expense.date).toLocaleTimeString(),
    Vendor: expense.vendor,
    Amount: expense.cost,
    Type: expense.costType,
    PaymentMode: expense.type,
    Tag: expense.tag || 'Untagged',
    User: expense.user,
  }));
};

/**
 * Generates export filename based on time range and file format
 * @param timeRange The selected time range for filtering
 * @param fileType File extension (xlsx, csv, etc.)
 * @returns Generated filename
 */
const generateFilename = (timeRange: string, fileType: string): string => {
  const rangeLabel = filterOptions.find(opt => opt.id === timeRange)?.label || timeRange;
  const dateStr = getCurrentDate('YYYYMMDD_HHmmss');

  return `Pennywise_${rangeLabel}_range_${dateStr}.${fileType}`
    .replace(' ', '')
    .toLowerCase();
};

/**
 * Export expense data as XLSX file
 * @param expenses List of expenses to export
 * @param timeRange The selected time range for filtering
 */
export const exportAsXLSX = async (expenses: Expense[], timeRange: string): Promise<void> => {
  if (!validateExpenses(expenses)) {
    return;
  }

  try {
    const formattedExpenses = formatExpenses(expenses);

    // Create a new workbook and worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    // Define columns with headers and widths
    worksheet.columns = [
      {header: 'Date', key: 'Date', width: 12},
      {header: 'Time', key: 'Time', width: 12},
      {header: 'Vendor', key: 'Vendor', width: 30},
      {header: 'Amount', key: 'Amount', width: 10},
      {header: 'Type', key: 'Type', width: 10},
      {header: 'PaymentMode', key: 'PaymentMode', width: 15},
      {header: 'Tag', key: 'Tag', width: 15},
      {header: 'User', key: 'User', width: 15},
    ];

    // Add data rows
    formattedExpenses.forEach(expense => {
      worksheet.addRow(expense);
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = {bold: true};
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {argb: 'FFE0E0E0'}
    };

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'}
        };
      });
    });

    const filename = generateFilename(timeRange, 'xlsx');

    // Generate Excel file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create a Blob and trigger download
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, filename);

    console.log(`Successfully exported ${expenses.length} expenses as XLSX for time range: ${timeRange}`);
  } catch (error) {
    console.error('Error exporting expenses as XLSX:', error);
    alert('Failed to export XLSX. Please try again.');
  }
};

/**
 * Export expense data as CSV file
 * @param expenses List of expenses to export
 * @param timeRange The selected time range for filtering
 */
export const exportAsCSV = (expenses: Expense[], timeRange: string): void => {
  if (!validateExpenses(expenses)) {
    return;
  }

  try {
    const formattedExpenses = formatExpenses(expenses);

    // Convert JSON to CSV
    const csv = json2csv(formattedExpenses, {
      emptyFieldValue: ''
    });

    const filename = generateFilename(timeRange, 'csv');

    // Create Blob and trigger download
    const dataBlob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    saveAs(dataBlob, filename);

    console.log(`Successfully exported ${expenses.length} expenses as CSV for time range: ${timeRange}`);
  } catch (error) {
    console.error('Error exporting expenses as CSV:', error);
    alert('Failed to export CSV. Please try again.');
  }
};
