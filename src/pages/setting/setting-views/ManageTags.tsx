/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import AddIcon from '@mui/icons-material/Add';
import {ArrowBack as BackIcon} from '@mui/icons-material';
import {useDispatch, useSelector} from 'react-redux';
import {selectExpense} from '../../../store/expenseActions';
import {expenseSlice} from '../../../store/expenseSlice';
import {sameTag} from '../../../domain/tags';
import './settingViews.scss';
import {useNavigate} from 'react-router-dom';

const ManageTags: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {tagList, legacyTagList} = useSelector(selectExpense);
  const [newTagName, setNewTagName] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');
  const [retiredOpen, setRetiredOpen] = useState<boolean>(false);

  useEffect(() => {
    ExpenseAPI.getTagConfig().then((config) => {
      dispatch(expenseSlice.actions.setTagList(config.tagList));
      dispatch(expenseSlice.actions.setLegacyTagList(config.legacyTagList || []));
    });
  }, [dispatch]);

  const persistConfig = (nextTagList: string[], nextLegacy: string[]) => {
    void ExpenseAPI.updateTagConfig({tagList: nextTagList, legacyTagList: nextLegacy});
  };

  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
    setDeleteConfirmDialog(true);
  };

  const confirmDeleteTag = () => {
    const stored = tagList.find((item) => sameTag(item, tagToDelete)) ?? tagToDelete;
    const nextTagList = tagList.filter((item) => !sameTag(item, stored));
    const nextLegacy = legacyTagList.some((item) => sameTag(item, stored))
      ? legacyTagList
      : [...legacyTagList, stored];
    dispatch(expenseSlice.actions.deleteTag(stored));
    persistConfig(nextTagList, nextLegacy);
    setDeleteConfirmDialog(false);
  };

  const handleOpenAddDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenDialog(false);
    setNewTagName('');
  };

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (!trimmed || tagList.some((item) => sameTag(item, trimmed))) {
      handleCloseAddDialog();
      return;
    }
    dispatch(expenseSlice.actions.addTag(trimmed));
    persistConfig(
      tagList.some((item) => sameTag(item, trimmed)) ? tagList : [...tagList, trimmed],
      legacyTagList.filter((item) => !sameTag(item, trimmed)),
    );
    handleCloseAddDialog();
  };

  const handleRestoreTag = (tag: string) => {
    dispatch(expenseSlice.actions.addTag(tag));
    persistConfig(
      tagList.some((item) => sameTag(item, tag)) ? tagList : [...tagList, tag],
      legacyTagList.filter((item) => !sameTag(item, tag)),
    );
  };

  return (
    <Container className="manage-tags-container" maxWidth="sm">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
        >
          <BackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Manage Tags
        </Typography>
      </Box>
      <Paper elevation={3} className="manage-tags-paper">
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{display: 'block', mb: 'var(--space-lg)'}}
        >
          Add or remove tags. Deleting a tag retires it; existing expenses keep it.
        </Typography>

        <Box className="tag-pills-cloud">
          {tagList.length === 0 ? (
            <Typography variant="body2" color="text.secondary" className="tag-pills-empty">
              No tags yet — add one below.
            </Typography>
          ) : (
            tagList.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                className="manage-tags-chip"
                color="primary"
                variant="outlined"
              />
            ))
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon/>}
          onClick={handleOpenAddDialog}
          className="add-tag-button"
        >
          Add New Tag
        </Button>

        {legacyTagList.length > 0 && (
          <Box sx={{mt: 'var(--space-lg)', width: '100%'}}>
            <Button
              variant="text"
              onClick={() => setRetiredOpen((open) => !open)}
              sx={{textTransform: 'none', color: 'var(--text-secondary)'}}
            >
              Retired tags ({legacyTagList.length})
            </Button>
            <Collapse in={retiredOpen}>
              <Box className="tag-pills-cloud" sx={{mt: 'var(--space-sm)'}}>
                {legacyTagList.map((tag) => (
                  <Box key={tag} sx={{display: 'inline-flex', alignItems: 'center', gap: 'var(--space-xs)'}}>
                    <Chip label={tag} variant="outlined"/>
                    <Button
                      size="small"
                      onClick={() => handleRestoreTag(tag)}
                      aria-label={`Restore tag ${tag}`}
                      sx={{textTransform: 'none'}}
                    >
                      Restore
                    </Button>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Tag</DialogTitle>
        <DialogContent className="tag-dialog-content">
          <DialogContentText>
            Enter the name for your new tag.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddTag} color="primary" disabled={!newTagName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Retire "${tagToDelete}"? Existing expenses keep this tag. You can restore it later.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteTag} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageTags;
