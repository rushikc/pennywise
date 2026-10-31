/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {createRef} from 'react';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SelectionPanel} from './Insights';

const renderPanel = (selected: string[], onItemsChange = jest.fn()) => {
  render(
    <SelectionPanel
      show
      onClose={jest.fn()}
      selectedItems={selected}
      onItemsChange={onItemsChange}
      availableItems={['food', 'gifts']}
      unlistedItems={new Set(['gifts'])}
      panelRef={createRef<HTMLDivElement>()}
    />,
  );
  return onItemsChange;
};

describe('Insights SelectionPanel', () => {
  it('keeps the selected styling for an unlisted chip and marks it', () => {
    renderPanel(['gifts']);
    const chip = screen.getByTestId('insights-chip-gifts');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveClass('MuiChip-filled');
    expect(chip).toHaveClass('selection-chip--unlisted');
    expect(chip).toHaveTextContent('gifts · not in list');
  });

  it('tells a selected unlisted chip apart from an unselected one', () => {
    renderPanel([]);
    const chip = screen.getByTestId('insights-chip-gifts');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(chip).toHaveClass('MuiChip-outlined');
    expect(screen.getByTestId('insights-chip-food')).not.toHaveClass('selection-chip--unlisted');
  });

  it('toggles an unlisted item like any other', async () => {
    const onChange = renderPanel([]);
    await userEvent.click(screen.getByTestId('insights-chip-gifts'));
    expect(onChange).toHaveBeenCalledWith(['gifts']);
  });
});
