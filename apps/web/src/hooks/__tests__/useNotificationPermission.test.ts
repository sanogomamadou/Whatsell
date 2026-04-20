import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationPermission } from '../useNotificationPermission';

// Mock apiClient
jest.mock('@/lib/api', () => ({
  apiClient: jest.fn().mockResolvedValue({ ok: true, status: 204 }),
}));

import { apiClient } from '@/lib/api';

// PushManager mock
const mockSubscribe = jest.fn();
const mockPushManager = { subscribe: mockSubscribe, getSubscription: jest.fn().mockResolvedValue(null) };
const mockRegistration = { pushManager: mockPushManager };

// Notification global mock — jsdom ne l'implémente pas
const mockRequestPermission = jest.fn();
class NotificationMock {
  static permission: NotificationPermission = 'default';
  static requestPermission = mockRequestPermission;
}

beforeAll(() => {
  // @ts-ignore
  global.Notification = NotificationMock;
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(mockRegistration) },
    writable: true,
    configurable: true,
  });
  // @ts-ignore
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
});

const mockSubscription = {
  endpoint: 'https://push.example.com/sub/1',
  toJSON: () => ({
    endpoint: 'https://push.example.com/sub/1',
    keys: { p256dh: 'key123', auth: 'auth456' },
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  NotificationMock.permission = 'default';
  mockSubscribe.mockResolvedValue(mockSubscription);
  mockRequestPermission.mockResolvedValue('default');
});

describe('useNotificationPermission', () => {
  it('retourne "unsupported" si Notification API absente', () => {
    const saved = global.Notification;
    // @ts-ignore
    delete global.Notification;
    const { result } = renderHook(() => useNotificationPermission());
    expect(result.current.permission).toBe('unsupported');
    // @ts-ignore
    global.Notification = saved;
  });

  it('retourne le statut initial de Notification.permission', () => {
    NotificationMock.permission = 'default';
    const { result } = renderHook(() => useNotificationPermission());
    expect(result.current.permission).toBe('default');
  });

  it('requestPermission POSTe vers API si permission accordée', async () => {
    mockRequestPermission.mockResolvedValue('granted');
    NotificationMock.permission = 'granted';

    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.requestPermission();
    });

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        '/api/v1/notifications/register-push',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('requestPermission ne POSTe pas si permission refusée', async () => {
    mockRequestPermission.mockResolvedValue('denied');
    NotificationMock.permission = 'denied';

    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('stocke dans localStorage après demande', async () => {
    mockRequestPermission.mockResolvedValue('denied');
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.requestPermission();
    });
    expect(localStorage.getItem('whatsell_push_permission_asked')).toBe('true');
  });

  it('isRegistering revient à false après la demande', async () => {
    mockRequestPermission.mockResolvedValue('denied');
    const { result } = renderHook(() => useNotificationPermission());
    await act(async () => {
      await result.current.requestPermission();
    });
    await waitFor(() => expect(result.current.isRegistering).toBe(false));
  });
});
