/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement, useEffect, useMemo, useState} from 'react';
import './TagExpenses.scss';
import Button from '@mui/material/Button';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {selectExpense, updateExpense} from '../../../store/expenseActions';
import {getDateMonthTime} from '../../../utility/utility';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
import {Expense} from '../../../Types';
import {v4 as uuidv4} from 'uuid';
import {extraTags, normalizeDescription, normalizeTags, withTags} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';
import {TagEditorFields} from './TagEditorFields';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onExpenseAdded?: (expense: Expense) => void;
}

const AddExpense: FC<AddExpenseModalProps> = ({open, onClose, onExpenseAdded}): ReactElement => {
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [cost, setCost] = useState<string>('');
  const isDesktop = useIsDesktop();

  const {tagList, legacyTagList, expenseList} = useSelector(selectExpense);

  useEffect(() => {
    if (open) {
      setSelectedPrimary('');
      setExtras([]);
      setDescription('');
      setNoteOpen(false);
      setCost('');
    }
  }, [open]);

  const extraSuggestions = useMemo(() => {
    const found = new Set<string>();
    for (const item of expenseList) {
      extraTags(item).forEach((tag) => found.add(tag));
    }
    return [...found].sort();
  }, [expenseList]);

  const onSaveExpense = () => {
    const uuid = uuidv4();
    const {tags} = normalizeTags(selectedPrimary, extras, {tagList, legacyTagList});
    const note = normalizeDescription(description);
    const newExpense: Expense = withTags({
      id: '',
      vendor: crypto.randomUUID().substring(0, 4) + ' manual entry',
      date: Date.now(),
      modifiedDate: Date.now(),
      cost: parseFloat(cost),
      costType: 'debit',
      mailId: uuid,
      user: 'manual',
      type: 'manual',
      operation: 'update',
    }, tags);
    if (note) {
      newExpense.description = note;
    }

    ExpenseAPI.addExpense(newExpense).then((expense) => {
      updateExpense(expense);
      if (onExpenseAdded) {
        onExpenseAdded(newExpense);
      }
      onClose();
    });
  };

  const formattedDateTime = getDateMonthTime(Date.now());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isDesktop ? 'sm' : false}
      fullWidth
      fullScreen={!isDesktop}
      slots={{
        transition: Zoom,
      }}
      transitionDuration={350}
    >
      <DialogContent className="tag-expense-dialog-content">
        <Fade in={open} timeout={400}>
          <div className="tag-expense-summary">
            <Typography variant="subtitle1" className="tag-expense-vendor">
              Add New Expense
            </Typography>
            <Typography variant="body2" className="tag-expense-date">
              {formattedDateTime}
            </Typography>
            <TextField
              label="Cost"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              slotProps={{
                input: {
                  startAdornment: <span style={{marginRight: 'var(--space-sm)'}}>₹</span>,
                },
              }}
              autoFocus
            />
          </div>
        </Fade>

        <Fade in={open} timeout={600}>
          <div>
            <TagEditorFields
              tagList={tagList}
              selectedPrimary={selectedPrimary}
              extras={extras}
              extraSuggestions={extraSuggestions}
              description={description}
              noteOpen={noteOpen}
              onPrimaryChange={setSelectedPrimary}
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
          disabled={cost === '0' || isNaN(parseFloat(cost))}
          onClick={onSaveExpense}
          className="tag-save-btn"
        >
          Save
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

export default AddExpense;
