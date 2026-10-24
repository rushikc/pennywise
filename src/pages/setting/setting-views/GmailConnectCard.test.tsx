/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GmailConnectCard from './GmailConnectCard';

const mockAuth = {
  currentUser: {uid: 'uid-1', displayName: 'Ada', email: 'ada@example.com'} as
    {uid: string; displayName: string; email: string} | null,
  dataMode: 'live' as 'demo' | 'live' | 'checking',
};

const mockRead = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockLoadGis = jest.fn();
const mockRequestCode = jest.fn();

jest.mock('../../login/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

jest.mock('../../../api/gmailConnect', () => ({
  readGmailStatus: (...args: unknown[]) => mockRead(...args),
  connectGmail: (...args: unknown[]) => mockConnect(...args),
  disconnectGmail: (...args: unknown[]) => mockDisconnect(...args),
  loadGisScript: (...args: unknown[]) => mockLoadGis(...args),
  requestGmailCode: (...args: unknown[]) => mockRequestCode(...args),
}));

describe('GmailConnectCard', () => {
  beforeEach(() => {
    mockAuth.dataMode = 'live';
    mockAuth.currentUser = {uid: 'uid-1', displayName: 'Ada', email: 'ada@example.com'};
    mockRead.mockReset();
    mockConnect.mockReset();
    mockDisconnect.mockReset();
    mockLoadGis.mockResolvedValue(undefined);
    mockRequestCode.mockResolvedValue('auth-code');
    mockConnect.mockResolvedValue({status: 'connected'});
    mockDisconnect.mockResolvedValue({status: 'disconnected'});
  });

  it('renders nothing in demo mode', () => {
    mockAuth.dataMode = 'demo';
    const {container} = render(<GmailConnectCard/>);
    expect(container).toBeEmptyDOMElement();
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('shows Connect Gmail when there is no connection', async () => {
    mockRead.mockResolvedValue({status: 'unknown', email: null, lastError: null});
    render(<GmailConnectCard/>);
    expect(await screen.findByText('Connect Gmail')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', {name: 'Connect'}));
    await waitFor(() => expect(mockConnect).toHaveBeenCalledWith('auth-code'));
  });

  it('shows Reconnect Gmail after a disconnect', async () => {
    mockRead.mockResolvedValue({status: 'disconnected', email: 'ada@example.com', lastError: 'invalid_grant'});
    render(<GmailConnectCard/>);
    expect(await screen.findByText('Reconnect Gmail')).toBeInTheDocument();
    expect(screen.getByText('invalid_grant')).toBeInTheDocument();
  });

  it('disconnects a connected mailbox', async () => {
    mockRead.mockResolvedValue({status: 'connected', email: 'ada@example.com', lastError: null});
    render(<GmailConnectCard/>);
    expect(await screen.findByText('Gmail connected')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', {name: 'Disconnect'}));
    await waitFor(() => expect(mockDisconnect).toHaveBeenCalled());
  });
});
