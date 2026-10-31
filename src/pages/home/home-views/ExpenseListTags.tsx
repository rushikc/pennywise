/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement, useState} from 'react';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import {Expense} from '../../../Types';
import {extraTags, primaryTag} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';

const extraChipSx = {
  height: 'var(--space-lg)',
  fontSize: 'var(--font-size-caption)',
  color: 'var(--text-secondary)',
  borderColor: 'var(--border-color)',
  backgroundColor: 'transparent',
};

export const ExpenseListTags: FC<{expense: Expense}> = ({expense}): ReactElement => {
  const isDesktop = useIsDesktop();
  const [noteOpen, setNoteOpen] = useState(false);
  const primary = primaryTag(expense);
  const extras = extraTags(expense);
  const description = expense.description?.trim();
  const extraCount = extras.length;

  return (
    <span className="expense-tag-cluster">
      <span className={primary ? 'tag-text-red' : 'tag-text-purple-light'}>
        {primary || 'untagged'}
      </span>
      {extraCount > 0 && isDesktop && extras.slice(0, 2).map((tag) => (
        <Chip
          key={tag}
          label={tag}
          size="small"
          variant="outlined"
          className="expense-extra-chip"
          sx={extraChipSx}
        />
      ))}
      {extraCount > 0 && (isDesktop ? extraCount > 2 : true) && (
        <span className="expense-extra-more">
          {isDesktop ? `+${extraCount - 2}` : `+${extraCount}`}
        </span>
      )}
      {description && (
        isDesktop ? (
          <Tooltip title={description}>
            <span className="expense-note-icon" aria-label="Expense note">
              <StickyNote2Outlined fontSize="inherit"/>
            </span>
          </Tooltip>
        ) : (
          <IconButton
            aria-label="Expense note"
            size="small"
            className="expense-note-button"
            onClick={(event) => {
              event.stopPropagation();
              setNoteOpen((open) => !open);
            }}
            sx={{padding: 'var(--space-xs)', color: 'var(--text-secondary)'}}
          >
            <StickyNote2Outlined fontSize="inherit"/>
          </IconButton>
        )
      )}
      {!isDesktop && noteOpen && description && (
        <span className="expense-note-text">{description}</span>
      )}
    </span>
  );
};
