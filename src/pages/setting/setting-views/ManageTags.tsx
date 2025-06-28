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

const ManageTags: React.FC = () => {
  const [tagList, setTagList] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<string>('');

  useEffect(() => {
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
    const updatedTags = tagList.filter(t => t !== tagToDelete);
    setTagList(updatedTags);
    void ExpenseAPI.updateTagList(updatedTags);
    setDeleteConfirmDialog(false);
    // Here you would update your backend/database
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
      setTagList([...tagList, newTagName]);
      handleCloseAddDialog();
      void ExpenseAPI.updateTagList([...tagList, newTagName]);
    }
  };

  return (
    <Container maxWidth="sm" sx={{mt: 4, mb: 4}}>
      <Paper elevation={3} sx={{p: 2, borderRadius: 2}}>
        <Typography variant="h5" gutterBottom sx={{mb: 2}}>
          Manage Tags
        </Typography>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tags">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {tagList.map((tag, index) => (
                  <Draggable key={tag} draggableId={tag} index={index}>
                    {(provided, snapshot) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          mb: 1,
                          borderRadius: 1,
                          bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          boxShadow: snapshot.isDragging ? 3 : 1,
                          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                          pr: 1, // Add padding for the delete button
                        }}
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
          fullWidth
          onClick={handleOpenAddDialog}
          sx={{mt: 2}}
        >
          Add New Tag
        </Button>
      </Paper>

      {/* Add New Tag Dialog */}
      <Dialog open={openDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Tag</DialogTitle>
        <DialogContent>
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
