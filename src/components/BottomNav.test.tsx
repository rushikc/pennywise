/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import BottomNav from './BottomNav';

const labels = ['Home', 'Stats', 'Budget', 'Profile'];

const renderNav = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <BottomNav/>
  </MemoryRouter>,
);

describe('BottomNav labels', () => {
  it('shows a small caption under each icon', () => {
    renderNav('/home');
    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeVisible();
    });
  });

  it.each(['/home', '/insights'])('pins the bar to document.body on %s', (path) => {
    renderNav(path);
    const bar = document.body.querySelector('.bottom-nav');
    expect(bar).not.toBeNull();
    expect(bar?.parentElement).toBe(document.body);
  });
});
