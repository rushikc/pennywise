/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {FC, ReactElement, useState} from 'react';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import StickyNote2Outlined from '@mui/icons-material/StickyNote2Outlined';
import {useSelector} from 'react-redux';
import {Expense} from '../../../Types';
import {displayTag, extraTags, primaryTag, tagListStatus} from '../../../domain/tags';
import {useIsDesktop} from '../../../hooks/useIsDesktop';
import {selectExpense} from '../../../store/expenseActions';

const extraChipSx = {
  height: 'var(--space-lg)',
  fontSize: 'var(--font-size-caption)',
  color: 'var(--text-secondary)',
  borderColor: 'var(--border-color)',
  backgroundColor: 'transparent',
};

export const ExpenseListTags: FC<{expense: Expense}> = ({expense}): ReactElement => {
  const isDesktop = useIsDesktop();
  const {tagList, legacyTagList} = useSelector(selectExpense);
  const [noteOpen, setNoteOpen] = useState(false);
  const primary = primaryTag(expense);
  const extras = extraTags(expense);
  const description = expense.description?.trim();
  const extraCount = extras.length;
  const unlisted = tagListStatus(primary, tagList, legacyTagList) === 'unlisted';
  const primaryLabel = primary
    ? (displayTag(primary, tagList, legacyTagList) || primary)
    : 'untagged';

  return (
    <span className="expense-tag-cluster">
      {unlisted && primary ? (
        <Chip
          size="small"
          variant="outlined"
          label={primaryLabel}
          title={`${primaryLabel} (not in tag list)`}
          aria-label={`${primaryLabel} (not in tag list)`}
          className="expense-unlisted-chip"
          sx={extraChipSx}
        />
      ) : (
        <span className={primary ? 'tag-text-red' : 'tag-text-purple-light'}>
          {primaryLabel}
        </span>
      )}
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
            <span
              className="expense-note-icon"
              tabIndex={0}
              role="img"
              aria-label="Expense note"
            >
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
