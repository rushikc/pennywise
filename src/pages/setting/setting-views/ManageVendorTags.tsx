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

const ManageVendorTags: React.FC = () => {
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

  const loadTagMaps = () => {
    setLoading(true);
    ExpenseAPI.getTagMapList()
      .then(maps => {
        setTagMaps(maps);
        setFilteredTagMaps(maps);
      })
      .catch(err => {
        setError('Failed to load tag maps');
        console.error('Error loading tag maps:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadTags = () => {
    ExpenseAPI.getTagList()
      .then(tags => {
        setAvailableTags(tags);
      })
      .catch(err => {
        console.error('Error loading tags:', err);
      });
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


  const handleEditClick = (tagMap: TagMap) => {
    setSelectedTagMap(tagMap);
    setSelectedTag(tagMap.tag);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (tagMapId: string) => {
    ExpenseAPI.deleteTagMap(tagMapId)
      .then(result => {
        if (result) {
          setSuccess('Tag map deleted successfully');
          // Remove the deleted item from the list
          setTagMaps(tagMaps.filter(tm => tm.id !== tagMapId));
          setFilteredTagMaps(filteredTagMaps.filter(tm => tm.id !== tagMapId));
        } else {
          setError('Failed to delete tag map');
        }
      })
      .catch(err => {
        setError('Error deleting tag map');
        console.error('Error deleting tag map:', err);
      });
  };

  const handleSaveEdit = () => {
    if (!selectedTagMap) return;

    const updatedTagMap: TagMap = {
      ...selectedTagMap,
      tag: selectedTag,
      date: new Date()
    };

    ExpenseAPI.updateTagMap(updatedTagMap)
      .then(result => {
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
      })
      .catch(err => {
        setError('Error updating tag map');
        console.error('Error updating tag map:', err);
      })
      .finally(() => {
        setEditDialogOpen(false);
      });
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
            className="search-field"
          />
        </div>

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

        {loading ? (
          <Box className="loading-container">
            <CircularProgress className="loading-indicator" />
          </Box>
        ) : filteredTagMaps.length === 0 ? (
          <Typography variant="body1" className="empty-cards-message">
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
                  primary={tagMap.vendor.toLowerCase().substring(0, 25)}
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
            <Box sx={{pt: 1}}>
              <Typography
                variant="subtitle1"
                className="vendor-name-display"
              >
                {selectedTagMap.vendor.toLowerCase()}
              </Typography>

              <Typography variant="subtitle1" className="tag-expense-category-label">
                Select a category
              </Typography>
              <Box className="tag-expense-chip-list">
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

export default ManageVendorTags;
