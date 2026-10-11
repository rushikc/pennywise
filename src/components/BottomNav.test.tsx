/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import BottomNav from './BottomNav';

jest.mock('@mui/material/useMediaQuery', () => jest.fn());

const mockedUseMediaQuery = useMediaQuery as jest.Mock;

const labels = ['Home', 'Stats', 'Budget', 'Profile'];

const renderNav = () => render(
  <MemoryRouter initialEntries={['/home']}>
    <BottomNav/>
  </MemoryRouter>,
);

describe('BottomNav labels', () => {
  it('hides captions under the icons on phone', () => {
    mockedUseMediaQuery.mockReturnValue(true);
    renderNav();
    labels.forEach((label) => {
      expect(screen.getByText(label)).not.toBeVisible();
    });
  });

  it('shows captions on wider screens', () => {
    mockedUseMediaQuery.mockReturnValue(false);
    renderNav();
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
    });
  });
});
