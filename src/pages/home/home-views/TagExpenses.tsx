/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement, useEffect, useMemo, useState} from 'react';
import './TagExpenses.scss';

import Button from '@mui/material/Button';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {hideTagExpense, selectExpense, setTagMap, updateExpense} from '../../../store/expenseActions';
import {formatVendorName, getDateMonthTime, JSONCopy} from '../../../utility/utility';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Zoom from '@mui/material/Zoom';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {createTimedAlert} from '../../../store/alertActions';
import {
  extraTags,
  normalizeDescription,
  normalizeTags,
  primaryTag,
  sameTag,
  withTags,
} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';
import {TagEditorFields} from './TagEditorFields';

const TagExpenses: FC = (): ReactElement => {
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [autoTag, setAutoTag] = useState(false);
  const [primaryError, setPrimaryError] = useState('');
  const isDesktop = useIsDesktop();

  const {vendorTagList, expense, isTagModal, tagList, legacyTagList, expenseList} = useSelector(selectExpense);

  useEffect(() => {
    if (!expense || !isTagModal) {
      return;
    }
    const primary = primaryTag(expense) || '';
    setSelectedPrimary(primary);
    setExtras(extraTags(expense));
    setDescription(expense.description || '');
    setNoteOpen(Boolean(expense.description));
    setAutoTag(false);
    setPrimaryError('');
  }, [expense, isTagModal]);

  const extraSuggestions = useMemo(() => {
    const found = new Set<string>();
    for (const item of expenseList) {
      extraTags(item).forEach((tag) => found.add(tag));
    }
    return [...found].sort();
  }, [expenseList]);

  if (expense == null || !isTagModal) {
    return <></>;
  }

  const copyToClipboard = async (str: string) => {
    try {
      await navigator.clipboard.writeText(str);
      createTimedAlert({message: 'Copied to clipboard', type: 'success'});
    } catch (err) {
      createTimedAlert({message: 'Failed to copy text', type: 'error'});
      console.error('Failed to copy text: ', err);
    }
  };

  const onSaveExpense = () => {
    if (!selectedPrimary && extras.length > 0) {
      if (!window.confirm('Untagging drops extra tags. Continue?')) {
        return;
      }
    }
    setPrimaryError('');
    if (autoTag && selectedPrimary) {
      const _vendor = expense.vendor;
      let tagObj = vendorTagList.find(({vendor, tag}) =>
        vendor.trim().toUpperCase() === _vendor.trim().toUpperCase() && sameTag(tag, selectedPrimary));
      if (!tagObj) {
        tagObj = {
          id: _vendor,
          vendor: _vendor,
          tag: selectedPrimary,
          date: Date.now(),
        };
        void ExpenseAPI.updateVendorTag(tagObj);
        setTagMap(tagObj);
      }
    }

    const expenseNew = JSONCopy(expense);
    const {tags} = normalizeTags(selectedPrimary, extras, {tagList, legacyTagList});
    Object.assign(expenseNew, withTags(expenseNew, tags));
    const note = normalizeDescription(description);
    if (note) {
      expenseNew.description = note;
    } else if (expense.description) {
      expenseNew.description = '';
    } else {
      delete expenseNew.description;
    }
    expenseNew.modifiedDate = Date.now();
    void ExpenseAPI.addExpense(expenseNew);
    updateExpense(expenseNew);
    hideTagExpense();
  };

  const vendorNames = formatVendorName(expense.vendor);
  const currentPrimary = primaryTag(expense);

  return (
    <Dialog
      open={isTagModal}
      onClose={hideTagExpense}
      maxWidth={isDesktop ? 'sm' : false}
      fullWidth
      fullScreen={!isDesktop}
      slots={{
        transition: Zoom,
      }}
      transitionDuration={350}
    >
      <DialogContent className="tag-expense-dialog-content">
        <Fade in={isTagModal} timeout={400}>
          <div className="tag-expense-summary">
            <Typography variant="subtitle1" className="tag-expense-vendor">
              {vendorNames[0]}
            </Typography>
            {
              vendorNames[1] &&
              <div className="d-flex justify-content-center">
                <Typography variant="subtitle1" className="tag-expense-vendor-upi">
                  {vendorNames[1]}
                </Typography>
                <IconButton
                  aria-label="copy vendor name"
                  className="tag-expense-copy-vendor"
                  onClick={() => copyToClipboard(vendorNames[1])}
                  size="small"
                  sx={{padding: 'var(--space-xs)'}}
                >
                  <ContentCopyIcon fontSize="small"/>
                </IconButton>
              </div>
            }
            <Typography variant="body2" className="tag-expense-date">
              {getDateMonthTime(expense.date)}
            </Typography>
            <Typography variant="h5">
              <span className="tag-expense-cost">₹{expense.cost}</span>
            </Typography>
            <Typography variant="caption">
              <span className={`tag-expense-tag${currentPrimary ? ' tagged' : ''}`}>
                {currentPrimary || 'untagged'}
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
            <TagEditorFields
              tagList={tagList}
              legacyTagList={legacyTagList}
              currentPrimaries={currentPrimary ? [currentPrimary] : []}
              selectedPrimary={selectedPrimary}
              extras={extras}
              extraSuggestions={extraSuggestions}
              description={description}
              noteOpen={noteOpen}
              onPrimaryChange={(tag) => {
                setPrimaryError('');
                setSelectedPrimary(tag);
              }}
              onExtrasChange={setExtras}
              onDescriptionChange={setDescription}
              onNoteOpen={() => setNoteOpen(true)}
            />
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
