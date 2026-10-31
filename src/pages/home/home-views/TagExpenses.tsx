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
import {formatVendorName, getDateMonthTime} from '../../../utility/utility';

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
  vendorKey,
  withTags,
  type ExpenseEdit,
} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';
import {TagEditorFields} from './TagEditorFields';
import {Expense} from '../../../Types';
import {OFFLINE_SAVE_MESSAGE} from '../../../utility/constants';

const TagExpenses: FC = (): ReactElement => {
  const [selectedPrimary, setSelectedPrimary] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [autoTag, setAutoTag] = useState(false);
  const [primaryError, setPrimaryError] = useState('');
  const [openedPrimary, setOpenedPrimary] = useState<string | null>(null);
  const [openedExtras, setOpenedExtras] = useState<string[]>([]);
  const [openedNote, setOpenedNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isDesktop = useIsDesktop();

  const {vendorTagList, expense, isTagModal, tagList, legacyTagList, expenseList} = useSelector(selectExpense);

  useEffect(() => {
    if (!expense || !isTagModal) {
      return;
    }
    const primary = primaryTag(expense);
    const extrasAtOpen = extraTags(expense);
    const noteAtOpen = normalizeDescription(expense.description) ?? null;
    setSelectedPrimary(primary || '');
    setOpenedPrimary(primary);
    setExtras(extrasAtOpen);
    setOpenedExtras(extrasAtOpen);
    setDescription(expense.description || '');
    setOpenedNote(noteAtOpen);
    setNoteOpen(Boolean(noteAtOpen));
    setAutoTag(false);
    setPrimaryError('');
    setSaving(false);
    // Snapshot only when this dialog opens for an expense id, not on later list updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTagModal, expense?.id]);

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

  const onSaveExpense = async () => {
    if (saving) {
      return;
    }
    if (!selectedPrimary && extras.length > 0) {
      if (!window.confirm('Untagging drops extra tags. Continue?')) {
        return;
      }
    }
    setPrimaryError('');

    const {tags} = normalizeTags(selectedPrimary, extras, {tagList, legacyTagList});
    const normalised = withTags({}, tags);
    const edit: ExpenseEdit = {};
    const nextPrimary = normalised.tag;
    const primaryChanged = Boolean(openedPrimary || nextPrimary) && !sameTag(openedPrimary, nextPrimary);
    if (primaryChanged) {
      edit.primary = nextPrimary ?? null;
    }
    const nextExtras = nextPrimary ? extras : [];
    if (primaryChanged || nextPrimary) {
      const removeExtras = openedExtras.filter((tag) => !nextExtras.some((item) => sameTag(item, tag)));
      const addExtras = nextExtras.filter((tag) => !openedExtras.some((item) => sameTag(item, tag)));
      if (removeExtras.length > 0) {
        edit.removeExtras = removeExtras;
      }
      if (addExtras.length > 0) {
        edit.addExtras = addExtras;
      }
    }
    const note = normalizeDescription(description) ?? null;
    if (note !== openedNote) {
      edit.description = note;
    }

    const _vendor = expense.vendor;
    const wantsVendorTag = autoTag && Boolean(selectedPrimary) && Boolean(vendorKey(_vendor));
    const vendorTagExists = wantsVendorTag && vendorTagList.some(({vendor, tag}) =>
      vendorKey(vendor) === vendorKey(_vendor) && sameTag(tag, selectedPrimary));
    const needsVendorTag = wantsVendorTag && !vendorTagExists;

    if (Object.keys(edit).length === 0 && !needsVendorTag) {
      hideTagExpense();
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      createTimedAlert({type: 'error', message: OFFLINE_SAVE_MESSAGE});
      return;
    }

    setSaving(true);
    try {
      let saved: Expense = expense;
      if (Object.keys(edit).length > 0) {
        saved = await ExpenseAPI.updateExpense(expense.id, edit);
      }
      if (needsVendorTag) {
        const tagObj = {
          id: _vendor,
          vendor: _vendor,
          tag: normalised.tag || selectedPrimary,
          date: Date.now(),
        };
        const ruleSaved = await ExpenseAPI.updateVendorTag(tagObj).catch(() => false);
        if (ruleSaved === false) {
          createTimedAlert({type: 'error', message: 'Saved, but the auto tag rule could not be saved'});
        } else {
          setTagMap(tagObj);
        }
      }
      updateExpense(saved);
      hideTagExpense();
    } catch {
      createTimedAlert({type: 'error', message: 'Could not save this expense'});
    } finally {
      setSaving(false);
    }
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
          onClick={() => void onSaveExpense()}
          disabled={saving}
          className="tag-save-btn"
          data-testid="tag-save"
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="outlined"
          onClick={hideTagExpense}
          disabled={saving}
          className="tag-close-btn"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagExpenses;
