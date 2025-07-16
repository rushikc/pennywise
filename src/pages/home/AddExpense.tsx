import {FC, ReactElement, useEffect, useState} from "react";
import './TagExpenses.scss';
import Button from "@mui/material/Button";
import {useSelector} from "react-redux";
import {ExpenseAPI} from "../../api/ExpenseAPI";
import {selectExpense, updateExpense} from "../../store/expenseActions";
import {getDateMonthTime} from "../../utility/utility";

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import TextField from '@mui/material/TextField';
import {Expense} from "../../Types";
import {v4 as uuidv4} from 'uuid';


interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onExpenseAdded?: (expense: Expense) => void;
}

const AddExpense: FC<AddExpenseModalProps> = ({open, onClose, onExpenseAdded}): ReactElement => {
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [cost, setCost] = useState<string>("");

  // Get tag list from the store
  const {tagList} = useSelector(selectExpense);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTag("");
      setCost("");
    }
  }, [open]);

  const onSaveExpense = () => {
    // Create a new expense object
    const uuid = uuidv4();
    const newExpense: Expense = {
      id: 'manual', // will be overridden by ExpenseAPI logic
      vendor: "manual entry", // As specified, set vendor as "manual"
      date: Date.now(),
      modifiedDate: Date.now(),
      cost: parseFloat(cost),
      tag: selectedTag,
      costType: "debit", // Default to debit
      mailId: uuid,
      user: "manual",
      type: "manual"
    };

    // Save the expense
    ExpenseAPI.addExpense(newExpense).then((expense) => {
      updateExpense(expense);
      // Call the onExpenseAdded callback if provided
      if (onExpenseAdded) {
        onExpenseAdded(newExpense);
      }
      onClose();
    });


  };

  // Format the current date and time
  const formattedDateTime = getDateMonthTime(Date.now());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
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
              InputProps={{
                startAdornment: <span style={{marginRight: 8}}>₹</span>,
              }}
              autoFocus
            />
          </div>
        </Fade>

        <Fade in={open} timeout={600}>
          <div>
            <Typography variant="subtitle1" className="tag-expense-category-label">
              Select a category
            </Typography>
            <div className="tag-expense-chip-list">
              {tagList.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  clickable
                  color={selectedTag === tag ? 'primary' : 'default'}
                  variant={selectedTag === tag ? 'filled' : 'outlined'}
                  onClick={() => setSelectedTag(tag)}
                  className={`tag-expense-chip${selectedTag === tag ? ' selected' : ''}`}
                  aria-label={`Select tag ${tag}`}
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

      <DialogActions className="tag-expense-dialog-actions">
        <Button
          variant="contained"
          disabled={selectedTag === "" || cost === "0" || isNaN(parseFloat(cost))}
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
