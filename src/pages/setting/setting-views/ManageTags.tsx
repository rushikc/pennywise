import React, {useEffect, useState} from 'react';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {DragDropContext, Draggable, Droppable, DropResult} from 'react-beautiful-dnd';
import AddIcon from '@mui/icons-material/Add';
import {RemoveCircleOutline} from "@mui/icons-material";
import {useSelector} from 'react-redux';
import {selectExpense, setTagList, addTag, deleteTag} from '../../../store/expenseActions';
import './settingViews.scss';

const ManageTags: React.FC = () => {
  const {tagList} = useSelector(selectExpense);
  const [newTagName, setNewTagName] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');


  useEffect(() => {
    // Initialize the tag list in Redux store
    ExpenseAPI.getTagList().then((tags: string[]) => {
      setTagList(tags);
    });
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(tagList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTagList(items);
    void ExpenseAPI.updateTagList(items);
  };

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
    if (newTagName && !tagList.includes(newTagName)) {
      addTag(newTagName);
      handleCloseAddDialog();
      void ExpenseAPI.updateTagList([...tagList, newTagName]);
    }
  };

  return (
    <Container className="manage-tags-container">
      <Paper elevation={3} className="manage-tags-paper">
        <Typography variant="h5" className="manage-tags-title">
          Manage Tags
        </Typography>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tags">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef} className="tag-list">
                {tagList.map((tag, index) => (
                  <Draggable key={tag} draggableId={tag} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`tag-item ${snapshot.isDragging ? 'is-dragging' : ''}`}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTag(tag);
                            }}
                            sx={{color: 'error.main'}}
                          >
                            <RemoveCircleOutline/>
                          </IconButton>
                        }
                      >
                        <ListItemText primary={tag}/>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>

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

      {/* Add New Tag Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the tag "{tagToDelete}"?
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
