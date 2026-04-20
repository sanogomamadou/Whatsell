import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentStatusIndicator } from '../AgentStatusIndicator';

describe('AgentStatusIndicator', () => {
  it('renders with status "active" — label Agent actif', () => {
    render(<AgentStatusIndicator status="active" />);
    expect(screen.getByText('Agent actif')).toBeInTheDocument();
  });

  it('renders with status "busy" — label En conversation', () => {
    render(<AgentStatusIndicator status="busy" />);
    expect(screen.getByText('En conversation')).toBeInTheDocument();
  });

  it('renders with status "busy" and conversationCount — label includes count', () => {
    render(<AgentStatusIndicator status="busy" conversationCount={3} />);
    expect(screen.getByText('En conversation (3)')).toBeInTheDocument();
  });

  it('renders with status "warning" — label Attention requise', () => {
    render(<AgentStatusIndicator status="warning" />);
    expect(screen.getByText('Attention requise')).toBeInTheDocument();
  });

  it('renders with status "offline" — label Hors ligne', () => {
    render(<AgentStatusIndicator status="offline" />);
    expect(screen.getByText('Hors ligne')).toBeInTheDocument();
  });

  it('renders with status "paused" — label En pause', () => {
    render(<AgentStatusIndicator status="paused" />);
    expect(screen.getByText('En pause')).toBeInTheDocument();
  });

  it('has role="status" attribute', () => {
    render(<AgentStatusIndicator status="active" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" by default', () => {
    render(<AgentStatusIndicator status="active" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-live="assertive" when offline', () => {
    render(<AgentStatusIndicator status="offline" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls onClick when offline and clicked', () => {
    const handler = jest.fn();
    render(<AgentStatusIndicator status="offline" onClick={handler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when non-offline and clicked', () => {
    const handler = jest.fn();
    render(<AgentStatusIndicator status="active" onClick={handler} />);
    const el = screen.getByRole('status');
    fireEvent.click(el);
    expect(handler).not.toHaveBeenCalled();
  });
});
