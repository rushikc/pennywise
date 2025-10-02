/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/

import {FC, ReactElement, useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {selectExpense, updateBudget, deleteBudget} from '../../store/expenseActions';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
import DeleteIcon from '@mui/icons-material/Delete';
import {Budget} from '../../Types';
import {createTimedAlert} from '../../store/alertActions';

interface EditBudgetModalProps {
  open: boolean;
  budget: Budget | null;
  onClose: () => void;
  onBudgetUpdated?: (budget: Budget) => void;
  onBudgetDeleted?: (budgetId: string) => void;
}

const EditBudget: FC<EditBudgetModalProps> = ({
  open,
  budget,
  onClose,
  onBudgetUpdated,
  onBudgetDeleted
}): ReactElement => {
  const [budgetName, setBudgetName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get tag list from the store
  const {tagList} = useSelector(selectExpense);

  // Initialize form when budget changes or modal opens
  useEffect(() => {
    if (open && budget) {
      setBudgetName(budget.name);
      setAmount(budget.amount.toString());
      setSelectedTags([...budget.tagList]);
    }
  }, [open, budget]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setBudgetName('');
      setAmount('');
      setSelectedTags([]);
    }
  }, [open]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const onSaveBudget = async () => {
    if (!budget) return;

    const updatedBudget: Budget = {
      ...budget,
      name: budgetName.trim(),
      amount: parseFloat(amount),
      tagList: selectedTags,
      modifiedDate: Date.now(),
      operation: 'update'
    };

    try {
      const result = await ExpenseAPI.updateBudget(updatedBudget);
      updateBudget(result);

      if (onBudgetUpdated) {
        onBudgetUpdated(result);
      }

      createTimedAlert({
        type: 'success',
        message: 'Budget updated successfully!'
      });
      onClose();
    } catch (error) {
      createTimedAlert({
        type: 'error',
        message: 'Failed to update budget. Please try again.'
      });
      console.error('Error updating budget:', error);
    }
  };

  const onDeleteBudget = async () => {
    if (!budget) return;

    try {
      const success = await ExpenseAPI.deleteBudget(budget);

      if (success) {
        deleteBudget(budget.id);

        if (onBudgetDeleted) {
          onBudgetDeleted(budget.id);
        }

        createTimedAlert({
          type: 'success',
          message: 'Budget deleted successfully!'
        });
        onClose();
      } else {
        createTimedAlert({
          type: 'error',
          message: 'Failed to delete budget. Please try again.'
        });
      }
    } catch (error) {
      createTimedAlert({
        type: 'error',
        message: 'Failed to delete budget. Please try again.'
      });
      console.error('Error deleting budget:', error);
    }
  };

  const isFormValid = () => {
    return budgetName.trim() !== '' &&
           !isNaN(parseFloat(amount)) &&
           parseFloat(amount) > 0 &&
           selectedTags.length > 0;
  };

  if (!budget) return <></>;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slots={{
        transition: Zoom
      }}
      transitionDuration={350}
    >
      <DialogContent className="tag-expense-dialog-content">
        <Fade in={open} timeout={400}>
          <div className="tag-expense-summary">
            <Typography variant="subtitle1" className="tag-expense-vendor">
              Edit Budget
            </Typography>

            <TextField
              label="Budget Name"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              autoFocus
            />

            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              variant="outlined"
              margin="normal"
              slotProps={{
                input: {
                  startAdornment: <span style={{marginRight: 8}}>₹</span>,
                }
              }}
            />
          </div>
        </Fade>

        <Fade in={open} timeout={600}>
          <div>
            <Typography variant="subtitle1" className="tag-expense-category-label">
              Select categories
            </Typography>
            <div className="tag-expense-chip-list">
              {tagList.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  clickable
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  onClick={() => handleTagToggle(tag)}
                  className={`tag-expense-chip${selectedTags.includes(tag) ? ' selected' : ''}`}
                  aria-label={`Toggle tag ${tag}`}
                  size="medium"
                  sx={{
                    minWidth: '80px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>
          </div>
        </Fade>
      </DialogContent>

      <DialogActions className="tag-expense-dialog-actions" sx={{ justifyContent: 'center', gap: 1 }}>
        <Button
          variant="contained"
          color="error"
          onClick={onDeleteBudget}
          className="tag-delete-btn"
          sx={{ minWidth: '80px' }}
        >
          Delete
        </Button>
        <Button
          variant="contained"
          disabled={!isFormValid()}
          onClick={onSaveBudget}
          className="tag-save-btn"
          sx={{ minWidth: '90px' }}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          className="tag-close-btn"
          sx={{ minWidth: '80px' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBudget;
