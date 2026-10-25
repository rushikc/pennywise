/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

jest.mock('../utility/buildMode', () => ({
  IS_DEMO_BUILD: true,
}));

jest.mock('../pages/login/AuthContext', () => ({
  useAuth: () => ({dataMode: 'demo'}),
}));

import {render, screen} from '@testing-library/react';
import DemoBanner from './DemoBanner';

describe('DemoBanner demo build', () => {
  it('renders the hosted-demo copy and GitHub link', () => {
    render(<DemoBanner/>);
    expect(screen.getByText(/Demo: sample data only/)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'View on GitHub'})).toHaveAttribute(
      'href',
      'https://github.com/rushikc/pennywise',
    );
  });
});
