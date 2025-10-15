/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement, useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {addBudget, deleteBudget, selectExpense, updateBudget} from '../../store/expenseActions';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
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

  // Determine if this is add mode (budget is null) or edit mode
  const isAddMode = budget === null;

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
    const budgetData = {
      name: budgetName.trim(),
      amount: parseFloat(amount),
      tagList: selectedTags,
      modifiedDate: Date.now(),
    };

    try {
      if (isAddMode) {
        // Create new budget
        const newBudget: Budget = {
          ...budgetData,
          id: '', // ID will be set by ExpenseAPI
          operation: 'create'
        };

        const result = await ExpenseAPI.addBudget(newBudget);
        addBudget(result);

        createTimedAlert({
          type: 'success',
          message: 'Budget created successfully!'
        });
      } else {
        // Update existing budget
        const updatedBudget: Budget = {
          ...budget,
          ...budgetData,
          operation: 'update'
        };

        const result = await ExpenseAPI.updateBudget(updatedBudget);
        updateBudget(result);

        createTimedAlert({
          type: 'success',
          message: 'Budget updated successfully!'
        });
      }

      if (onBudgetUpdated && budget) {
        onBudgetUpdated(budget);
      }

      onClose();
    } catch (error) {
      createTimedAlert({
        type: 'error',
        message: `Failed to ${isAddMode ? 'create' : 'update'} budget. Please try again.`
      });
      console.error(`Error ${isAddMode ? 'creating' : 'updating'} budget:`, error);
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
              {isAddMode ? 'Add Budget' : 'Edit Budget'}
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

            <div style={{marginTop: 16}}>
              <Chip
                label="Select One or More Tags"
                variant="filled"
                color="primary"
                size="medium"
                style={{marginBottom: 20, fontSize: 13}}
              />
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {tagList.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                    onClick={() => handleTagToggle(tag)}
                    variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  />
                ))}
              </div>
            </div>
          </div>
        </Fade>
      </DialogContent>

      <DialogActions>
        {/* Only show delete button when editing existing budget (not in add mode) */}
        {!isAddMode && (
          <Button
            variant="contained"
            color="error"
            onClick={onDeleteBudget}
            className="tag-delete-btn"
            sx={{minWidth: '80px'}}
          >
            Delete
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={onClose}
          className="tag-close-btn"
          sx={{minWidth: '80px'}}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={!isFormValid()}
          onClick={onSaveBudget}
          className="tag-save-btn"
          sx={{minWidth: '90px'}}
        >
          {isAddMode ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBudget;
