/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {FC, ReactElement, useEffect, useState} from 'react';
import './TagExpenses.scss'; // We'll reuse the existing styles for consistency
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import {useSelector} from 'react-redux';
import {Expense} from '../../../Types';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {selectExpense} from '../../../store/expenseActions';
import Zoom from '@mui/material/Zoom';
import {TransitionProps} from '@mui/material/transitions';
import {formatVendorName} from '../../../utility/utility';
import {createTimedAlert} from '../../../store/alertActions';
import {mergedCostAndType, signedExpenseTotal} from './mergeMath';
import {
  extraTags,
  normalizeDescription,
  normalizeTags,
  primaryTag,
  withTags,
} from '../../../domain/tags';
import {TagEditorFields} from './TagEditorFields';
import {useIsDesktop} from '../../../hooks/useIsDesktop';

interface MergeExpensesProps {
  expenses: Expense[];
  open: boolean;
  onClose: () => void;
  onMergeComplete?: (mergedExpense: Expense) => void;
}

const ZoomTransition = React.forwardRef(function ZoomTransition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Zoom ref={ref} {...props} />;
});


const MergeExpenses: FC<MergeExpensesProps> = ({
  expenses,
  open,
  onClose,
  onMergeComplete
}): ReactElement => {
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [extras, setExtras] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number>(0);
  const isDesktop = useIsDesktop();

  const {tagList, legacyTagList, expenseList} = useSelector(selectExpense);

  useEffect(() => {
    if (open && expenses.length > 0) {
      setTotalCost(signedExpenseTotal(expenses));
      setSelectedVendor('');
      setSelectedTag('');
      const seen = new Set<string>();
      const union: string[] = [];
      for (const tag of expenses.flatMap((item) => extraTags(item))) {
        if (!seen.has(tag)) {
          seen.add(tag);
          union.push(tag);
        }
      }
      setExtras(union);
      const survivor = expenses[0];
      const firstNote = normalizeDescription(survivor?.description) ||
        expenses.map((item) => normalizeDescription(item.description)).find(Boolean);
      setDescription(firstNote || '');
      setNoteOpen(Boolean(firstNote));
    }
  }, [expenses, open]);

  const onSaveMergedExpense = async () => {
    // Validate vendor selection
    if (!selectedVendor) {
      createTimedAlert({
        type: 'error',
        message: 'Please select a vendor first'
      });
      return;
    }

    // Find the expense object that corresponds to the selected vendor or use first expense as fallback
    const vendorExpense = expenses.find(exp => exp.vendor === selectedVendor) || expenses[0];

    // Create a new merged expense with properties from the selected vendor's expense
    const {cost, costType} = mergedCostAndType(totalCost);
    const primary = selectedTag || primaryTag(vendorExpense);
    const {tags} = normalizeTags(primary, extras, {
      tagList,
      legacyTagList,
    });
    const note = normalizeDescription(description);
    const mergedExpense: Expense = withTags({
      id: vendorExpense.id,
      vendor: selectedVendor,
      cost,
      date: vendorExpense.date,
      modifiedDate: Date.now(),
      costType,
      mailId: vendorExpense.mailId,
      user: vendorExpense.user,
      type: vendorExpense.type,
      operation: 'merged',
      enrichedAt: vendorExpense.enrichedAt,
    }, tags);
    if (note) {
      mergedExpense.description = note;
    }

    // Log the merged expense for debugging
    console.log('Merged Expense:', mergedExpense);

    // Soft delete all original expenses from the database
    const promiseList: Promise<Expense>[] = [];
    expenses.forEach(exp => {
      promiseList.push(ExpenseAPI.addExpense(exp, 'delete'));
    });

    await Promise.all(promiseList);

    // Add the new merged expense to the database
    await ExpenseAPI.addExpense(mergedExpense);

    // Complete the merge process
    if (onMergeComplete) {
      onMergeComplete(mergedExpense); // Update Redux store via callback
    } else {
      onClose();
    }
  };

  // Get unique vendors from selected expenses
  const uniqueVendors = Array.from(new Set(expenses.map(exp => exp.vendor)));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isDesktop ? 'sm' : false}
      fullWidth
      fullScreen={!isDesktop}
      slotProps={{
        transition: {
          timeout: 350,
        },
      }}
      slots={{
        transition: ZoomTransition
      }}
    >
      <DialogContent className="tag-expense-dialog-content">
        <Fade in={open} timeout={400}>
          <div className="tag-expense-summary">
            <Typography variant="subtitle1" className="tag-expense-title">
              Merge {expenses.length} Expenses
            </Typography>

            <Typography variant="h5">
              <span className={`tag-expense-cost ${totalCost < 0 ? 'negative' : ''}`}>
                {totalCost < 0 ? '- ' : '+ '}₹{Math.abs(totalCost).toFixed(2)}
              </span>
            </Typography>

            <Typography variant="caption" className="tag-expense-merge-info">
              Select vendor for the merged expense:
            </Typography>

            <div className="tag-expense-vendor-chips">
              {uniqueVendors.map((vendor, index) => (
                <Chip
                  key={index}
                  label={formatVendorName(vendor)[0] || vendor}
                  clickable
                  color={selectedVendor === vendor ? 'primary' : 'default'}
                  variant={selectedVendor === vendor ? 'filled' : 'outlined'}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`tag-expense-chip${selectedVendor === vendor ? ' selected' : ''}`}
                  aria-label={`Select vendor ${vendor}`}
                  size="medium"
                  sx={{
                    margin: 'var(--space-xs)',
                    transition: 'all var(--transition-fast)'
                  }}
                />
              ))}
            </div>
          </div>
        </Fade>

        <Fade in={open} timeout={600}>
          <div>
          <TagEditorFields
            tagList={tagList}
            legacyPrimary={primaryTag(expenses[0])}
            selectedPrimary={selectedTag}
            extras={extras}
            extraSuggestions={[...new Set(expenseList.flatMap((item) => extraTags(item)))].sort()}
            description={description}
            noteOpen={noteOpen}
            onPrimaryChange={setSelectedTag}
            onExtrasChange={setExtras}
            onDescriptionChange={setDescription}
            onNoteOpen={() => setNoteOpen(true)}
          />
          </div>
        </Fade>

      </DialogContent>

      <DialogActions className="tag-expense-dialog-actions">
        <Button
          variant="contained"
          onClick={onSaveMergedExpense}
          className="tag-save-btn"
        >
          Merge
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          className="tag-close-btn"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergeExpenses;
