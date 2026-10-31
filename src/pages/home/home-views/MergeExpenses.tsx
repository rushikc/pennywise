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
import Alert from '@mui/material/Alert';
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
  displayTag,
  extraTags,
  groupKey,
  normalizeDescription,
  normalizeTags,
  primaryTag,
  sameTag,
  type ExpenseEdit,
} from '../../../domain/tags';
import {TagEditorFields} from './TagEditorFields';
import {useIsDesktop} from '../../../hooks/useIsDesktop';
import {OFFLINE_SAVE_MESSAGE} from '../../../utility/constants';

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
  const [openedExtras, setOpenedExtras] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number>(0);
  const [primaryError, setPrimaryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [tagTouched, setTagTouched] = useState(false);
  const isDesktop = useIsDesktop();

  const {tagList, legacyTagList, expenseList} = useSelector(selectExpense);

  useEffect(() => {
    if (open && expenses.length > 0) {
      setTotalCost(signedExpenseTotal(expenses));
      setSelectedVendor('');
      setSelectedTag(displayTag(primaryTag(expenses[0]), tagList, legacyTagList) || '');
      setTagTouched(false);
      setSaving(false);
      const seen = new Set<string>();
      const union: string[] = [];
      for (const tag of expenses.flatMap((item) => extraTags(item))) {
        const key = groupKey(tag) || tag.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          union.push(tag);
        }
      }
      setExtras(union);
      setOpenedExtras(union);
      const survivor = expenses[0];
      const firstNote = normalizeDescription(survivor?.description) ||
        expenses.map((item) => normalizeDescription(item.description)).find(Boolean);
      setDescription(firstNote || '');
      setNoteOpen(Boolean(firstNote));
      setPrimaryError('');
    }
    // Tag lists are read at open time only; later list updates must not reset the picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, open]);

  const onVendorChange = (vendor: string) => {
    setSelectedVendor(vendor);
    if (tagTouched) {
      return;
    }
    const survivor = expenses.find((exp) => exp.vendor === vendor) || expenses[0];
    setSelectedTag(displayTag(primaryTag(survivor), tagList, legacyTagList) || '');
  };

  const onSaveMergedExpense = async () => {
    if (saving) {
      return;
    }
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
    if (!selectedTag && extras.length > 0) {
      setPrimaryError('Choose a primary tag to keep extra tags.');
      return;
    }
    setPrimaryError('');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      createTimedAlert({type: 'error', message: OFFLINE_SAVE_MESSAGE});
      return;
    }

    const {cost, costType} = mergedCostAndType(totalCost);
    const {tags} = normalizeTags(selectedTag, extras, {
      tagList,
      legacyTagList,
    });
    const note = normalizeDescription(description) ?? null;
    const keepExtras = extraTags(vendorExpense);
    const edit: ExpenseEdit = {
      primary: tags[0] ?? null,
      addExtras: extras.filter((tag) => !keepExtras.some((item) => sameTag(item, tag))),
      removeExtras: openedExtras.filter((tag) => !extras.some((item) => sameTag(item, tag))),
      cost,
      vendor: selectedVendor,
      date: vendorExpense.date,
      costType,
      type: vendorExpense.type,
      operation: 'merged',
      description: note,
    };

    setSaving(true);
    let mergedExpense;
    try {
      mergedExpense = await ExpenseAPI.updateExpense(vendorExpense.id, edit);
    } catch {
      createTimedAlert({type: 'error', message: 'Could not save the merged expense'});
      setSaving(false);
      return;
    }

    const drops = expenses.filter((exp) => exp.id !== vendorExpense.id);
    try {
      for (const exp of drops) {
        await ExpenseAPI.updateExpense(exp.id, {operation: 'delete'});
      }
    } catch {
      createTimedAlert({type: 'error', message: 'Merged expense was saved, but not every duplicate could be removed'});
      setSaving(false);
      return;
    }
    setSaving(false);

    if (onMergeComplete) {
      onMergeComplete(mergedExpense);
    } else {
      onClose();
    }
  };

  const uniqueVendors = Array.from(new Set(expenses.map(exp => exp.vendor)));
  const extrasNeedPrimary = extras.length > 0 && !selectedTag;

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
                  onClick={() => onVendorChange(vendor)}
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
              legacyTagList={legacyTagList}
              currentPrimaries={expenses.map((item) => primaryTag(item)).filter((tag): tag is string => Boolean(tag))}
              selectedPrimary={selectedTag}
              extras={extras}
              extraSuggestions={[...new Set(expenseList.flatMap((item) => extraTags(item)))].sort()}
              description={description}
              noteOpen={noteOpen}
              onPrimaryChange={(tag) => {
                setPrimaryError('');
                setTagTouched(true);
                setSelectedTag(tag);
              }}
              onExtrasChange={setExtras}
              onDescriptionChange={setDescription}
              onNoteOpen={() => setNoteOpen(true)}
            />
            {extrasNeedPrimary && (
              <Alert
                severity="warning"
                sx={{mt: 'var(--space-md)', color: 'var(--text-primary)'}}
              >
                Choose a primary tag to keep extra tags.
              </Alert>
            )}
            {primaryError && (
              <Alert
                severity="error"
                sx={{mt: 'var(--space-md)', color: 'var(--text-primary)'}}
              >
                {primaryError}
              </Alert>
            )}
          </div>
        </Fade>

      </DialogContent>

      <DialogActions className="tag-expense-dialog-actions">
        <Button
          variant="contained"
          disabled={extrasNeedPrimary || saving}
          onClick={() => void onSaveMergedExpense()}
          className="tag-save-btn"
          data-testid="merge-save"
        >
          {saving ? 'Merging…' : 'Merge'}
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={saving}
          className="tag-close-btn"
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergeExpenses;
