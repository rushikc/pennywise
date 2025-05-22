import {FC, ReactElement, useState} from "react";
import './TagExpenses.scss';

import Button from "@mui/material/Button";
import {useSelector} from "react-redux";
import {ExpenseAPI} from "../api/ExpenseAPI";
import {hideTagExpense, selectExpense, setTagMap} from "../store/expenseActions";
import {getDateMonthTime, JSONCopy} from "../utility/utility";

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';


const tag_list = ['food', 'groceries', 'amenities', 'veg & fruits', 'snacks',
  'shopping', 'electronics' ,'rent', 'extra', 'ironing', 'petrol', 'transport', 'bike', 'parents',
  'parents-amazon', 'Skin & Hair', 'medical', 'clothes', 'fitness', 'invalid'];

const TagExpenses: FC<any> = (): ReactElement => {

  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const [autoTag, setAutoTag] = useState<boolean>(false);

  const { tagList, expense, isTagModal } = useSelector(selectExpense);

  if (expense == null || !isTagModal) {
    return <></>;
  }

  const onSaveExpense = () => {
    if (autoTag && selectedTag.length > 0) {
      let _vendor = expense.vendor;
      let _tag = expense.tag;

      let tagObj = tagList.find(({ vendor, tag }) => vendor === _vendor && tag === _tag);

      if (!tagObj) {
        let key = _vendor;
        tagObj = {
          vendor: _vendor,
          tag: selectedTag[0],
          date: getDateMonthTime()
        };
        void ExpenseAPI.setOneDoc(key, tagObj, 'tagMap');
        setTagMap(tagObj);
      }
    }

    let expenseNew = JSONCopy(expense);
    expenseNew.tag = selectedTag[0];
    void ExpenseAPI.addExpense(expenseNew);
    hideTagExpense();
  };

  const formatVendorName = (vendor: string) => {
    return vendor ? vendor.substring(0,20)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .toLowerCase(): '';
  };

  return (
    <Dialog
      open={isTagModal}
      onClose={hideTagExpense}
      maxWidth="xs"
      fullWidth
      TransitionComponent={Zoom}
      transitionDuration={350}
    >
      <DialogContent className="tag-expense-dialog-content">
        <Fade in={isTagModal} timeout={400}>
          <div className="tag-expense-summary">
            <Typography variant="subtitle1" className="tag-expense-vendor">
              {formatVendorName(expense.vendor)}
            </Typography>
            <Typography variant="body2" className="tag-expense-date">
              {getDateMonthTime(expense.date)}
            </Typography>
            <Typography variant="h5">
              <span className="tag-expense-cost">₹{expense.cost}</span>
            </Typography>
            <Typography variant="caption">
              <span className={`tag-expense-tag${expense.tag ? ' tagged' : ''}`}>
                {expense.tag ? expense.tag : 'untagged'}
              </span>
            </Typography>
          </div>
        </Fade>

        <Fade in={isTagModal} timeout={500}>
          <div className="tag-expense-autotag">
            <div className={`tag-expense-autotag-inner${autoTag ? ' active' : ''}`}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoTag}
                    onChange={() => setAutoTag(!autoTag)}
                    color="primary"
                  />
                }
                label="Auto Tag future transactions"
                sx={{ mb: 0, width: '100%', justifyContent: 'center', ml: 0 }}
                style={{ margin: 0, width: '100%' }}
              />
            </div>
          </div>
        </Fade>

        <Fade in={isTagModal} timeout={600}>
          <div>
            <Typography variant="subtitle2" className="tag-expense-category-label">
              Select a category
            </Typography>
            <div className="tag-expense-chip-list">
              {tag_list.map((val, index) => (
                <Chip
                  key={index}
                  label={val}
                  clickable
                  color={selectedTag.includes(val) ? 'primary' : 'default'}
                  variant={selectedTag.includes(val) ? 'filled' : 'outlined'}
                  onClick={() => setSelectedTag([val])}
                  className={`tag-expense-chip${selectedTag.includes(val) ? ' selected' : ''}`}
                  aria-label={`Select tag ${val}`}
                />
              ))}
            </div>
          </div>
        </Fade>
      </DialogContent>

      <DialogActions className="tag-expense-dialog-actions">
        <Button
          variant="contained"
          disabled={selectedTag.length === 0}
          onClick={onSaveExpense}
          className="tag-save-btn"
        >
          Save
        </Button>
        <Button
          variant="outlined"
          onClick={hideTagExpense}
          className="tag-close-btn"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagExpenses;

