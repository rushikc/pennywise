import React, {FC, ReactElement, useEffect, useState} from "react";
import './TagExpenses.scss'; // We'll reuse the existing styles for consistency
import Button from "@mui/material/Button";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import {useSelector} from "react-redux";
import {Expense} from '../../Types';
import {ExpenseAPI} from "../../api/ExpenseAPI";
import {selectExpense} from "../../store/expenseActions";
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Zoom from '@mui/material/Zoom';
import {TransitionProps} from '@mui/material/transitions';

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
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [totalCost, setTotalCost] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showError, setShowError] = useState<boolean>(false);

  // Get tagList from Redux store instead of props
  const {tagList} = useSelector(selectExpense);

  useEffect(() => {
    if (open && expenses.length > 0) {
      // Calculate the total cost when handling multiple expenses
      const total = expenses.reduce((sum, exp) => {
        // Determine if cost should be added or subtracted based on costType
        const costValue = exp.cost;
        return sum + (exp.costType === 'debit' ? -costValue : costValue);
      }, 0);

      setTotalCost(total);

      // Reset selected values when modal opens
      setSelectedVendor("");
      setSelectedTag("");
    }
  }, [expenses, open]);

  const onSaveMergedExpense = () => {
    // Validate vendor selection
    if (!selectedVendor) {
      setErrorMessage("Please select a vendor first");
      setShowError(true);
      return;
    }

    // Find the expense object that corresponds to the selected vendor or use first expense as fallback
    const vendorExpense = expenses.find(exp => exp.vendor === selectedVendor) || expenses[0];

    // Create a new merged expense with properties from the selected vendor's expense
    const mergedExpense: Expense = {
      id: vendorExpense.id,
      vendor: selectedVendor,
      tag: selectedTag || vendorExpense.tag, // Use selected tag or keep original
      cost: Math.abs(totalCost),
      date: vendorExpense.date,
      costType: totalCost < 0 ? 'debit' : 'credit',
      mailId: vendorExpense.mailId,
      user: vendorExpense.user,
      type: vendorExpense.type
    };

    // Log the merged expense for debugging
    console.log("Merged Expense:", mergedExpense);

    // Delete all original expenses from the database
    expenses.forEach(exp => {
      void ExpenseAPI.deleteExpense(exp);
    });

    // Add the new merged expense to the database
    void ExpenseAPI.addExpense(mergedExpense);

    // Complete the merge process
    if (onMergeComplete) {
      onMergeComplete(mergedExpense); // Update Redux store via callback
    } else {
      onClose();
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const formatVendorName = (vendor: string) => {
    return vendor ? vendor.substring(0, 20)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .toLowerCase() : '';
  };

  // Get unique vendors from selected expenses
  const uniqueVendors = Array.from(new Set(expenses.map(exp => exp.vendor)));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
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
                  label={formatVendorName(vendor)}
                  clickable
                  color={selectedVendor === vendor ? 'primary' : 'default'}
                  variant={selectedVendor === vendor ? 'filled' : 'outlined'}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`tag-expense-chip${selectedVendor === vendor ? ' selected' : ''}`}
                  aria-label={`Select vendor ${vendor}`}
                  size="medium"
                  sx={{
                    margin: '4px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>
          </div>
        </Fade>

        <Fade in={open} timeout={600}>
          <div>
            <Typography
              variant="subtitle1"
              className="tag-expense-category-label"
            >
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

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{width: '100%'}}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default MergeExpenses;
