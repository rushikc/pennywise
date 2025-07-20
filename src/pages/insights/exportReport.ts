/*
Copyright (C) 2025 Rushikesh <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {Expense} from "../../Types";
import {utils, write} from "xlsx";
import {saveAs} from "file-saver";
import {filterOptions} from "../dataValidations";
import {getCurrentDate} from "../../utility/utility";
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
}

/**
 * Validates if the expense data can be exported
 * @param expenses List of expenses to validate
 * @returns true if expenses can be exported, false otherwise
 */
const validateExpenses = (expenses: Expense[]): boolean => {
    if (!expenses || expenses.length === 0) {
        console.warn("No expense data to export");
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
export const exportAsXLSX = (expenses: Expense[], timeRange: string): void => {
    if (!validateExpenses(expenses)) {
        return;
    }

    try {
        const formattedExpenses = formatExpenses(expenses);

        // Create a worksheet from the formatted data
        const worksheet = utils.json_to_sheet(formattedExpenses);

        // Adjust column widths
        worksheet["!cols"] = [
            {wch: 12}, // Date
            {wch: 12}, // Time
            {wch: 20}, // Vendor
            {wch: 10}, // Amount
            {wch: 10}, // Type
            {wch: 15}, // PaymentMode
            {wch: 15}, // Tag
        ];

        // Create a workbook with the worksheet
        const workbook = {
            SheetNames: ["Expenses"],
            Sheets: {
                Expenses: worksheet,
            },
        };

        const filename = generateFilename(timeRange, 'xlsx');

        // Convert workbook to a binary string
        const excelBuffer = write(workbook, {bookType: 'xlsx', type: 'array'});

        // Create a Blob and trigger download
        const blob = new Blob([excelBuffer], {
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
        const dataBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(dataBlob, filename);

        console.log(`Successfully exported ${expenses.length} expenses as CSV for time range: ${timeRange}`);
    } catch (error) {
        console.error('Error exporting expenses as CSV:', error);
        alert('Failed to export CSV. Please try again.');
    }
};
