import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationPermissionPrompt } from '../NotificationPermissionPrompt';

// Mock du hook
const mockRequestPermission = jest.fn();
const mockHookReturn = {
  permission: 'default' as NotificationPermission | 'unsupported',
  requestPermission: mockRequestPermission,
  isRegistering: false,
};

jest.mock('@/hooks', () => ({
  useNotificationPermission: () => mockHookReturn,
}));

describe('NotificationPermissionPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockHookReturn.permission = 'default';
    mockHookReturn.isRegistering = false;
    mockRequestPermission.mockResolvedValue(undefined);
  });

  it('s\'affiche si permission === "default" (jamais demandé)', () => {
    render(<NotificationPermissionPrompt />);
    expect(screen.getByText(/Activez les notifications/i)).toBeInTheDocument();
  });

  it('bouton "Activer" appelle requestPermission', async () => {
    render(<NotificationPermissionPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /activer/i }));
    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });
  });

  it('bouton "Plus tard" cache le prompt et stocke en localStorage', () => {
    render(<NotificationPermissionPrompt />);
    fireEvent.click(screen.getByRole('button', { name: /plus tard/i }));
    expect(screen.queryByText(/Activez les notifications/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('whatsell_push_prompt_dismissed')).toBe('true');
  });

  it('invisible si permission === "granted"', () => {
    mockHookReturn.permission = 'granted';
    render(<NotificationPermissionPrompt />);
    expect(screen.queryByText(/Activez les notifications/i)).not.toBeInTheDocument();
  });

  it('invisible si permission === "denied"', () => {
    mockHookReturn.permission = 'denied';
    render(<NotificationPermissionPrompt />);
    expect(screen.queryByText(/Activez les notifications/i)).not.toBeInTheDocument();
  });

  it('invisible si permission === "unsupported"', () => {
    mockHookReturn.permission = 'unsupported';
    render(<NotificationPermissionPrompt />);
    expect(screen.queryByText(/Activez les notifications/i)).not.toBeInTheDocument();
  });
});
