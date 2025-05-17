import {FC, ReactElement, useState} from "react";

import Button from "@mui/material/Button/Button";
import {useSelector} from "react-redux";
import {ExpenseAPI} from "../api/ExpenseAPI";
import {hideTagExpense, selectExpense, setTagMap} from "../store/expenseActions";
import {getCurrentDate, getDateMonthTime, JSONCopy} from "../utility/utility";

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';


const tag_list = ['food', 'groceries', 'Amenities', 'veg & fruits', 'snacks',
  'shopping', 'rent', 'extra', 'ironing', 'petrol', 'transport', 'bike', 'parents',
  'parents-amazon', 'Skin & Hair', 'emi', 'medical', 'clothes', 'noodles', 'fitness', 'alcohol'];

const TagExpenses: FC<any> = (): ReactElement => {

  const [selectedTag, setSelectedTag] = useState<string[]>([]);
  const [autoTag, setAutoTag] = useState<boolean>(false);

  const { tagList, expense, isTagModal } = useSelector(selectExpense);

  if (expense == null || !isTagModal) {
    return <></>;
  }

  const onSaveExpense = () => {
    console.log('onSaveExpense ');
    console.log('autoTag ', autoTag);

    let _vendor = expense.vendor;
    let _tag = expense.tag;

    if (autoTag) {
      let tagObj = tagList.find(({ vendor, tag }) => vendor === _vendor && tag === _tag);

      console.log('tagObj ', tagObj);

      if (!tagObj) {
        let key = _vendor;
        tagObj = {
          vendor: _vendor,
          tag: selectedTag[0],
          date: getCurrentDate()
        };
        ExpenseAPI.setOneDoc(key, tagObj, 'tagMap');
        setTagMap(tagObj);
      }
    }

    console.log('Saving expense ', expense);

    const expenseNew = JSONCopy(expense);
    expenseNew.tag = selectedTag[0];
    console.log('Saving expense new', JSONCopy(expenseNew));
    ExpenseAPI.addExpense(expenseNew);
  };

  return (
    <Dialog open={isTagModal} onClose={hideTagExpense} maxWidth="xs" fullWidth>
      <DialogContent sx={{ pb: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 16, background: 'rgb(54 54 54)', borderRadius: 12, padding: '14px 0', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#e4e6eb', letterSpacing: 0.2, mb: 0.5 }}>
            {expense.vendor ? expense.vendor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''}
          </Typography>
          <Typography variant="body2" sx={{ color: '#a0aec0' }}>{getDateMonthTime(expense.date)}</Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
            <span style={{ color: '#7ed957', fontWeight: 700 }}>₹{expense.cost}</span>
          </Typography>
          <Typography variant="caption" sx={{ display: 'inline-block', mt: 0.5, px: 1.5, py: 0.5, borderRadius: 1.5, fontWeight: 500, fontSize: 13, background: expense.tag ? 'rgba(239,154,154,0.08)' : 'rgba(179,157,219,0.08)', color: expense.tag ? '#ef9a9a' : '#b39ddb', border: expense.tag ? '1px solid #ef9a9a' : '1px solid #b39ddb', minWidth: 54, textAlign: 'center', textTransform: 'capitalize' }}>
            {expense.tag ? expense.tag : 'untagged'}
          </Typography>
        </div>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            background: autoTag ? 'rgba(76, 175, 80, 0.12)' : 'rgba(0,0,0,0.04)',
            borderRadius: 16,
            padding: '8px 0',
            boxShadow: autoTag ? '0 2px 8px 0 rgba(76,175,80,0.10)' : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 260,
            width: '100%',
            maxWidth: 400
          }}>
            <FormControlLabel
              control={<Switch checked={autoTag} onChange={() => setAutoTag(!autoTag)} color="primary" />}
              label={<span style={{ fontWeight: 500 }}>Auto Tag future transactions</span>}
              sx={{ mb: 0, width: '100%', justifyContent: 'center', ml: 0 }}
              style={{ margin: 0, width: '100%' }}
            />
          </div>
        </div>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>Select a category</Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
          {tag_list.map((val, index) => (
            <Chip
              key={index}
              label={val}
              clickable
              color={selectedTag.includes(val) ? 'primary' : 'default'}
              variant={selectedTag.includes(val) ? 'filled' : 'outlined'}
              onClick={() => setSelectedTag([val])}
              sx={{ fontWeight: 500, fontSize: 13, borderRadius: 2 }}
              aria-label={`Select tag ${val}`}
            />
          ))}
        </div>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          disabled={selectedTag.length === 0}
          onClick={onSaveExpense}
          sx={{ minWidth: 120, borderRadius: 2 }}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={hideTagExpense}
          sx={{ minWidth: 120, borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagExpenses;

