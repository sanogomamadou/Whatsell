import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { CelebrationToast, CELEBRATION_TRIGGERS } from '../CelebrationToast';
import { useCelebrationToast } from '../../../hooks/useCelebrationToast';

// Mock useToast
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('CelebrationToast component', () => {
  it('renders message and default emoji', () => {
    render(<CelebrationToast message="Première commande !" />);
    expect(screen.getByText('Première commande !')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Célébration' })).toBeInTheDocument();
  });

  it('renders custom emoji', () => {
    render(<CelebrationToast message="Super !" emoji="🚀" />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders subMessage when provided', () => {
    render(<CelebrationToast message="Bravo" subMessage="Continue comme ça !" />);
    expect(screen.getByText('Continue comme ça !')).toBeInTheDocument();
  });

  it('does not render subMessage when absent', () => {
    render(<CelebrationToast message="Bravo" />);
    expect(screen.queryByText('Continue comme ça !')).not.toBeInTheDocument();
  });
});

describe('CELEBRATION_TRIGGERS', () => {
  it('exports all 4 trigger keys', () => {
    expect(CELEBRATION_TRIGGERS.FIRST_ORDER).toBeDefined();
    expect(CELEBRATION_TRIGGERS.FIRST_AGENT_ACTIVATION).toBeDefined();
    expect(CELEBRATION_TRIGGERS.TENTH_ORDER).toBeDefined();
    expect(CELEBRATION_TRIGGERS.FIRST_VIP_CUSTOMER).toBeDefined();
  });
});

describe('useCelebrationToast hook', () => {
  beforeEach(() => {
    mockToast.mockClear();
    sessionStorage.clear();
  });

  it('calls toast() when triggerCelebration is invoked', () => {
    const { result } = renderHook(() => useCelebrationToast());
    act(() => {
      result.current.triggerCelebration('Première commande !');
    });
    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.anything() })
    );
  });

  it('only triggers once per session when triggerKey is provided', () => {
    const { result } = renderHook(() => useCelebrationToast());
    act(() => {
      result.current.triggerCelebration('Bravo', {
        triggerKey: CELEBRATION_TRIGGERS.FIRST_ORDER,
      });
    });
    act(() => {
      result.current.triggerCelebration('Bravo encore', {
        triggerKey: CELEBRATION_TRIGGERS.FIRST_ORDER,
      });
    });
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('triggers only once per session without triggerKey (global dedup)', () => {
    const { result } = renderHook(() => useCelebrationToast());
    act(() => { result.current.triggerCelebration('Message 1'); });
    act(() => { result.current.triggerCelebration('Message 2'); });
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it('stores trigger key in sessionStorage', () => {
    const { result } = renderHook(() => useCelebrationToast());
    act(() => {
      result.current.triggerCelebration('Test', {
        triggerKey: CELEBRATION_TRIGGERS.TENTH_ORDER,
      });
    });
    expect(sessionStorage.getItem(CELEBRATION_TRIGGERS.TENTH_ORDER)).toBe('1');
  });
});
