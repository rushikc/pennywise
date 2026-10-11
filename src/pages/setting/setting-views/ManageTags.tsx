/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Chip,
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
import {useSelector} from 'react-redux';
import {addTag, deleteTag, selectExpense, setTagList} from '../../../store/expenseActions';
import './settingViews.scss';
import {useNavigate} from 'react-router-dom';

const ManageTags: React.FC = () => {
  const navigate = useNavigate();

  const {tagList} = useSelector(selectExpense);
  const [newTagName, setNewTagName] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');


  useEffect(() => {
    ExpenseAPI.getTagList().then((tags: string[]) => {
      setTagList(tags);
    });
  }, []);

  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
    setDeleteConfirmDialog(true);
  };

  const confirmDeleteTag = () => {
    deleteTag(tagToDelete);
    void ExpenseAPI.updateTagList(tagList.filter(t => t !== tagToDelete));
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
    if (trimmed && !tagList.includes(trimmed)) {
      addTag(trimmed);
      handleCloseAddDialog();
      void ExpenseAPI.updateTagList([...tagList, trimmed]);
    }
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
          Add or remove tags. Tap the × on a pill to delete.
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
            {`Are you sure you want to delete the tag "${tagToDelete}"?`}
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
