/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement} from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {TAG_LIMITS, normalizeTags, sameTag} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';

export const TagEditorFields: FC<{
  tagList: string[];
  legacyPrimary?: string | null;
  selectedPrimary: string;
  extras: string[];
  extraSuggestions: string[];
  description: string;
  noteOpen: boolean;
  onPrimaryChange: (tag: string) => void;
  onExtrasChange: (extras: string[]) => void;
  onDescriptionChange: (value: string) => void;
  onNoteOpen: () => void;
}> = ({
  tagList,
  legacyPrimary,
  selectedPrimary,
  extras,
  extraSuggestions,
  description,
  noteOpen,
  onPrimaryChange,
  onExtrasChange,
  onDescriptionChange,
  onNoteOpen,
}): ReactElement => {
  const isDesktop = useIsDesktop();
  const showLegacy = Boolean(
    legacyPrimary &&
    !tagList.some((tag) => tag.toLowerCase() === legacyPrimary.toLowerCase()),
  );
  const extraLimit = TAG_LIMITS.maxTags - 1;

  const applyExtras = (values: string[]) => {
    const {tags} = normalizeTags(selectedPrimary, values);
    onExtrasChange(tags.slice(1));
  };

  return (
    <div className={`tag-expense-fields${isDesktop ? ' tag-expense-fields-split' : ''}`}>
      <div>
        <Typography variant="subtitle1" className="tag-expense-category-label">
          Primary tag
        </Typography>
        <div className="tag-expense-chip-list">
          <Chip
            label="Untagged"
            clickable
            color={!selectedPrimary ? 'primary' : 'default'}
            variant={!selectedPrimary ? 'filled' : 'outlined'}
            onClick={() => onPrimaryChange('')}
            className={`tag-expense-chip${!selectedPrimary ? ' selected' : ''}`}
            aria-label="Select tag untagged"
          />
          {showLegacy && legacyPrimary && (
            <Chip
              label={`${legacyPrimary} (retired)`}
              clickable
              color={sameTag(selectedPrimary, legacyPrimary) ? 'primary' : 'default'}
              variant={sameTag(selectedPrimary, legacyPrimary) ? 'filled' : 'outlined'}
              onClick={() => onPrimaryChange(legacyPrimary)}
              className={`tag-expense-chip${sameTag(selectedPrimary, legacyPrimary) ? ' selected' : ''}`}
              aria-label={`Select tag ${legacyPrimary}`}
            />
          )}
          {tagList.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              clickable
              color={sameTag(selectedPrimary, tag) ? 'primary' : 'default'}
              variant={sameTag(selectedPrimary, tag) ? 'filled' : 'outlined'}
              onClick={() => onPrimaryChange(tag)}
              className={`tag-expense-chip${sameTag(selectedPrimary, tag) ? ' selected' : ''}`}
              aria-label={`Select tag ${tag}`}
            />
          ))}
        </div>
      </div>
      <div>
        <Typography variant="subtitle1" className="tag-expense-category-label">
          Extra tags {selectedPrimary ? `${extras.length}/${extraLimit}` : ''}
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          disabled={!selectedPrimary}
          options={extraSuggestions}
          value={extras}
          onChange={(_event, value) => applyExtras(value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({index})}
                key={option}
                label={option}
                size="small"
                variant="outlined"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={selectedPrimary ? 'Add extra tags' : 'Choose a primary tag first'}
            />
          )}
        />
      </div>
      <div className="tag-expense-note">
        {!noteOpen && !description ? (
          <Button variant="text" onClick={onNoteOpen} className="tag-note-toggle">
            Add note
          </Button>
        ) : (
          <TextField
            label="Note"
            multiline
            minRows={2}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            helperText={`${description.length}/${TAG_LIMITS.maxDescription}`}
            inputProps={{maxLength: TAG_LIMITS.maxDescription}}
            fullWidth
          />
        )}
      </div>
    </div>
  );
};
