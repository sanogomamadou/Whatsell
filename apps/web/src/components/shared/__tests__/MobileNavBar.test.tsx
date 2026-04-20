import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileNavBar } from '../MobileNavBar';

describe('MobileNavBar', () => {
  const noop = jest.fn();

  beforeEach(() => {
    noop.mockClear();
  });

  it('renders 5 tabs', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} />);
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Commandes')).toBeInTheDocument();
    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Catalogue')).toBeInTheDocument();
    expect(screen.getByText('Plus')).toBeInTheDocument();
  });

  it('has role="navigation" on the nav element', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('sets aria-current="page" on active tab only', () => {
    render(<MobileNavBar activeTab="orders" onTabChange={noop} />);
    const buttons = screen.getAllByRole('button');
    const activeBtn = buttons.find((b) => b.getAttribute('aria-current') === 'page');
    expect(activeBtn).toBeDefined();
    expect(activeBtn).toHaveAccessibleName(/Commandes/);

    // Only one tab should be active
    const allActive = buttons.filter((b) => b.getAttribute('aria-current') === 'page');
    expect(allActive).toHaveLength(1);
  });

  it('calls onTabChange with correct tab when clicked', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} />);
    fireEvent.click(screen.getByText('Commandes'));
    expect(noop).toHaveBeenCalledWith('orders');
  });

  it('calls onTabChange for all 5 tabs', () => {
    const handler = jest.fn();
    render(<MobileNavBar activeTab="home" onTabChange={handler} />);
    const tabs = ['Accueil', 'Commandes', 'Conversations', 'Catalogue', 'Plus'];
    const tabIds = ['home', 'orders', 'conversations', 'catalog', 'more'];
    tabs.forEach((label, i) => {
      fireEvent.click(screen.getByText(label));
      expect(handler).toHaveBeenLastCalledWith(tabIds[i]);
    });
  });

  it('displays badge count when count < 10', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} badges={{ orders: 4 }} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays "9+" when badge count >= 10', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} badges={{ conversations: 15 }} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('includes badge count in aria-label when badge > 0', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} badges={{ orders: 4 }} />);
    const btn = screen.getByRole('button', { name: /Commandes, 4 en attente/i });
    expect(btn).toBeInTheDocument();
  });

  it('uses simple label when no badge', () => {
    render(<MobileNavBar activeTab="home" onTabChange={noop} />);
    expect(screen.getByRole('button', { name: 'Commandes' })).toBeInTheDocument();
  });
});
