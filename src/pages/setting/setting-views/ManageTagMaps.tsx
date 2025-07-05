import React, {useEffect, useState} from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import {ArrowBack as BackIcon, RemoveCircleOutline, Search as SearchIcon} from '@mui/icons-material';
import {TagMap} from '../../../Types';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {useNavigate} from 'react-router-dom';
import './settingViews.scss';

const ManageTagMaps: React.FC = () => {
  const navigate = useNavigate();
  const [tagMaps, setTagMaps] = useState<TagMap[]>([]);
  const [filteredTagMaps, setFilteredTagMaps] = useState<TagMap[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTagMap, setSelectedTagMap] = useState<TagMap | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTagMaps();
    loadTags();
  }, []);

  useEffect(() => {
    filterTagMaps();
  }, [searchTerm, tagMaps]);

  const loadTagMaps = async () => {
    setLoading(true);
    try {
      const maps = await ExpenseAPI.getTagMapList();
      setTagMaps(maps);
      setFilteredTagMaps(maps);
    } catch (err) {
      setError('Failed to load tag maps');
      console.error('Error loading tag maps:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await ExpenseAPI.getTagList();
      setAvailableTags(tags);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const filterTagMaps = () => {
    if (!searchTerm.trim()) {
      setFilteredTagMaps(tagMaps);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = tagMaps.filter(
      (tagMap) =>
        tagMap.vendor.toLowerCase().includes(term) ||
        tagMap.tag.toLowerCase().includes(term)
    );
    setFilteredTagMaps(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleEditClick = (tagMap: TagMap) => {
    setSelectedTagMap(tagMap);
    setSelectedTag(tagMap.tag);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = async (tagMapId: string) => {
    try {
      const result = await ExpenseAPI.deleteTagMap(tagMapId);
      if (result) {
        setSuccess('Tag map deleted successfully');
        // Remove the deleted item from the list
        setTagMaps(tagMaps.filter(tm => tm.id !== tagMapId));
        setFilteredTagMaps(filteredTagMaps.filter(tm => tm.id !== tagMapId));
      } else {
        setError('Failed to delete tag map');
      }
    } catch (err) {
      setError('Error deleting tag map');
      console.error('Error deleting tag map:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTagMap) return;

    try {
      const updatedTagMap: TagMap = {
        ...selectedTagMap,
        tag: selectedTag,
        date: new Date()
      };

      const result = await ExpenseAPI.updateTagMap(updatedTagMap);
      if (result) {
        setSuccess('Tag map updated successfully');
        // Update the item in the list
        setTagMaps(tagMaps.map(tm =>
          tm.id === updatedTagMap.id ? updatedTagMap : tm
        ));
        setFilteredTagMaps(filteredTagMaps.map(tm =>
          tm.id === updatedTagMap.id ? updatedTagMap : tm
        ));
      } else {
        setError('Failed to update tag map');
      }
    } catch (err) {
      setError('Error updating tag map');
      console.error('Error updating tag map:', err);
    } finally {
      setEditDialogOpen(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <Container className="manage-tags-container">
      <Box className="config-header">
        <IconButton
          onClick={() => navigate('/profile')}
          className="back-button"
        >
          <BackIcon/>
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          Configuration
        </Typography>
      </Box>
      <Paper elevation={3} className="manage-tags-paper">
        <Typography variant="h5" className="manage-tags-title">
          Manage Tag Maps
        </Typography>

        {error && (
          <Typography color="error" variant="body2" className="message-text">
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="primary" variant="body2" className="message-text">
            {success}
          </Typography>
        )}

        <div>
          <TextField
            fullWidth
            placeholder="Search by vendor or tag"
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2, mt: 2}}
          />
        </div>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredTagMaps.length === 0 ? (
          <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
            No vendor-tag mappings found.
          </Typography>
        ) : (
          <List className="tag-list">
            {filteredTagMaps.map((tagMap) => (
              <ListItem
                key={tagMap.id}
                divider
                className="tag-item"
                onClick={() => handleEditClick(tagMap)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(tagMap.id);
                    }}
                    sx={{color: 'error.main'}}
                  >
                    <RemoveCircleOutline/>
                  </IconButton>
                }
              >
                <ListItemText
                  primary={tagMap.vendor.toLowerCase().substring(0,25)}
                  secondary={`Tag: ${tagMap.tag}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Edit Tag Map Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Vendor Tag</DialogTitle>
        <DialogContent>
          {selectedTagMap && (
            <Box sx={{ pt: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '10px 15px',
                  backgroundColor: '#5b5b61',
                  borderRadius: '8px',
                  width: '100%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: 'white'
                }}
              >
                {selectedTagMap.vendor.toLowerCase()}
              </Typography>

              <Typography variant="subtitle1" className="tag-expense-category-label" sx={{ mt: 2, mb: 1 }}>
                Select a category
              </Typography>
              <Box className="tag-expense-chip-list" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    color={selectedTag === tag ? 'primary' : 'default'}
                    variant={selectedTag === tag ? 'filled' : 'outlined'}
                    onClick={() => setSelectedTag(tag)}
                    className={`tag-expense-chip${selectedTag === tag ? ' selected' : ''}`}
                    size="medium"
                    sx={{
                      minWidth: '80px',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            disabled={!selectedTag}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageTagMaps;
