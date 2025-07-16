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
import {VendorTag} from '../../../Types';
import {ExpenseAPI} from '../../../api/ExpenseAPI';
import {useNavigate} from 'react-router-dom';
import './settingViews.scss';

const ManageVendorTags: React.FC = () => {
  const navigate = useNavigate();
  const [vendorTags, setVendorTags] = useState<VendorTag[]>([]);
  const [filteredVendorTags, setFilteredVendorTags] = useState<VendorTag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVendorTag, setSelectedVendorTag] = useState<VendorTag | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadVendorTags();
    loadTags();
  }, []);

  useEffect(() => {
    filterVendorTags();
  }, [searchTerm, vendorTags]);

  const loadVendorTags = () => {
    setLoading(true);
    ExpenseAPI.getVendorTagList()
      .then(maps => {
        setVendorTags(maps);
        setFilteredVendorTags(maps);
      })
      .catch(err => {
        setError('Failed to load vendor tags');
        console.error('Error loading vendor tags:', err);
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

  const filterVendorTags = () => {
    if (!searchTerm.trim()) {
      setFilteredVendorTags(vendorTags);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = vendorTags.filter(
      (vendorTag) =>
        vendorTag.vendor.toLowerCase().includes(term) ||
        vendorTag.tag.toLowerCase().includes(term)
    );
    setFilteredVendorTags(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };


  const handleEditClick = (VendorTag: VendorTag) => {
    setSelectedVendorTag(VendorTag);
    setSelectedTag(VendorTag.tag);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (vendorTagId: string) => {
    ExpenseAPI.deleteVendorTag(vendorTagId)
      .then(result => {
        if (result) {
          setSuccess('Vendor tag deleted successfully');
          // Remove the deleted item from the list
          setVendorTags(vendorTags.filter(tm => tm.id !== vendorTagId));
          setFilteredVendorTags(filteredVendorTags.filter(tm => tm.id !== vendorTagId));
        } else {
          setError('Failed to delete vendor tag');
        }
      })
      .catch(err => {
        setError('Error deleting vendor tag');
        console.error('Error deleting vendor tag:', err);
      });
  };

  const handleSaveEdit = () => {
    if (!selectedVendorTag) return;

    const updatedVendorTag: VendorTag = {
      ...selectedVendorTag,
      tag: selectedTag,
      date: Date.now()
    };

    ExpenseAPI.updateVendorTag(updatedVendorTag)
      .then(result => {
        if (result) {
          setSuccess('Vendor tag updated successfully');
          // Update the item in the list
          setVendorTags(vendorTags.map(tm =>
            tm.id === updatedVendorTag.id ? updatedVendorTag : tm
          ));
          setFilteredVendorTags(filteredVendorTags.map(tm =>
            tm.id === updatedVendorTag.id ? updatedVendorTag : tm
          ));
        } else {
          setError('Failed to update vendor tag');
        }
      })
      .catch(err => {
        setError('Error updating vendor tag');
        console.error('Error updating vendor tag:', err);
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
          Manage Vendor Tags
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
        ) : filteredVendorTags.length === 0 ? (
          <Typography variant="body1" className="empty-cards-message">
            No vendor-tag mappings found.
          </Typography>
        ) : (
          <List className="tag-list">
            {filteredVendorTags.map((VendorTag) => (
              <ListItem
                key={VendorTag.id}
                divider
                className="tag-item"
                onClick={() => handleEditClick(VendorTag)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(VendorTag.id);
                    }}
                    sx={{color: 'error.main'}}
                  >
                    <RemoveCircleOutline/>
                  </IconButton>
                }
              >
                <ListItemText
                  primary={VendorTag.vendor.toLowerCase().substring(0, 25)}
                  secondary={`Tag: ${VendorTag.tag}`}
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
          {selectedVendorTag && (
            <Box sx={{pt: 1}}>
              <Typography
                variant="subtitle1"
                className="vendor-name-display"
              >
                {selectedVendorTag.vendor.toLowerCase()}
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
