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

import {FC, ReactElement, useState} from 'react';
import './TagExpenses.scss';

import Button from '@mui/material/Button';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {hideTagExpense, selectExpense, setTagMap, updateExpense} from '../../../store/expenseActions';
import {getDateMonthTime, JSONCopy} from '../../../utility/utility';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';


const TagExpenses: FC<any> = (): ReactElement => {

  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const [autoTag, setAutoTag] = useState<boolean>(false);

  const {vendorTagList, expense, isTagModal, tagList} = useSelector(selectExpense);

  if (expense == null || !isTagModal) {
    return <></>;
  }

  const onSaveExpense = () => {
    if (autoTag && selectedTag.length > 0) {
      const _vendor = expense.vendor;
      const _tag = expense.tag;

      let tagObj = vendorTagList.find(({vendor, tag}) => vendor === _vendor && tag === _tag);

      if (!tagObj) {
        tagObj = {
          id: _vendor,
          vendor: _vendor,
          tag: selectedTag[0],
          date: Date.now()
        };
        void ExpenseAPI.updateVendorTag(tagObj);
        setTagMap(tagObj);
      }
    }

    const expenseNew = JSONCopy(expense);
    console.log('Saving expense with tag:', expenseNew);
    expenseNew.tag = selectedTag[0];
    void ExpenseAPI.addExpense(expenseNew);
    updateExpense(expenseNew);
    hideTagExpense();
  };

  const formatVendorName = (vendor: string) => {
    return vendor ? vendor.substring(0, 20)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .toLowerCase() : '';
  };

  return (
    <Dialog
      open={isTagModal}
      onClose={hideTagExpense}
      maxWidth="xs"
      fullWidth
      slots={{
        transition: Zoom
      }}
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
                label="Auto tag future transactions"
                sx={{mb: 0, width: '100%', justifyContent: 'center', ml: 0}}
                style={{margin: 0, width: '100%'}}
              />
            </div>
          </div>
        </Fade>

        <Fade in={isTagModal} timeout={600}>
          <div>
            <Typography variant="subtitle1" className="tag-expense-category-label">
              Select a category
            </Typography>
            <div className="tag-expense-chip-list">
              {tagList.map((val, index) => (
                <Chip
                  key={index}
                  label={val}
                  clickable
                  color={selectedTag.includes(val) ? 'primary' : 'default'}
                  variant={selectedTag.includes(val) ? 'filled' : 'outlined'}
                  onClick={() => setSelectedTag([val])}
                  className={`tag-expense-chip${selectedTag.includes(val) ? ' selected' : ''}`}
                  aria-label={`Select tag ${val}`}
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
