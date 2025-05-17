import {FC, ReactElement, useState} from "react";

import Button from "@mui/material/Button/Button";
import Paper from '@mui/material/Paper';
import {styled} from '@mui/material/styles';
import {useSelector} from "react-redux";
import {ExpenseAPI} from "../api/ExpenseAPI";
import {hideTagExpense, selectExpense, setTagMap} from "../store/expenseActions";
import {getCurrentDate, getDateMonthTime, JSONCopy} from "../utility/utility";

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';

const PaperStyled = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
}));

const ButtonStyled = styled(Button)(({ theme }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  height: 50,
  fontSize: 12
}));

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
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, pb: 1 }}>
        Tag Transaction
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{expense.vendor}</Typography>
          <Typography variant="body2" color="text.secondary">{getDateMonthTime(expense.date)}</Typography>
          <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 500 }}>
            <span style={{ color: '#4caf50', fontWeight: 700 }}>₹{expense.cost}</span>
          </Typography>
          <Typography variant="caption" color={expense.tag ? 'error' : 'primary'} sx={{ display: 'block', mt: 0.5 }}>
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




