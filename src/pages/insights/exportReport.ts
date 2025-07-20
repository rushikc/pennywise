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

/**
 * Export expense data as XLSX file
 * @param expenses List of expenses to export
 * @param timeRange The selected time range for filtering
 */
export const exportAsXLSX = (expenses: Expense[], timeRange: string): void => {

    if (!expenses || expenses.length === 0) {
        console.warn("No expense data to export");
        return;
    }

    try {
        // Format the expenses for the Excel sheet - converting dates and transforming data
        const formattedExpenses = expenses.map(expense => ({
            Date: new Date(expense.date).toLocaleDateString(),
            Time: new Date(expense.date).toLocaleTimeString(),
            Vendor: expense.vendor,
            Amount: expense.cost,
            Type: expense.costType,
            PaymentMode: expense.type,
            Tag: expense.tag || 'Untagged',
        }));

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

        // Get date range label for the filename
        const rangeLabel = filterOptions.find(opt => opt.id === timeRange)?.label || timeRange;

        // Generate filename with current date and time
        const dateStr = getCurrentDate('YYYYMMDD_HHmmss');
        const filename = 'Pennywise_' +
            `${rangeLabel}_range_${dateStr}.xlsx`
                .replace(' ', '')
                .toLowerCase();

        // Convert workbook to a binary string - fix the parameter order
        const excelBuffer = write(workbook, {bookType: 'xlsx', type: 'array'});

        // Create a Blob from the buffer
        const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});

        // Trigger file download using file-saver
        saveAs(blob, filename);

        console.log('Successfully exported', expenses.length, 'expenses as XLSX for time range:', timeRange);
    } catch (error) {
        console.error('Error exporting expenses as XLSX:', error);
    }
};

/**
 * Export expense data as CSV file
 * @param expenses List of expenses to export
 * @param timeRange The selected time range for filtering
 */
export const exportAsCSV = (expenses: Expense[], timeRange: string): void => {
    // Implementation will be added later
    console.log('Exporting as CSV', expenses.length, 'expenses for time range:', timeRange);
};
