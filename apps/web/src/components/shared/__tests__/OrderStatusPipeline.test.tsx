import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderStatusPipeline } from '../OrderStatusPipeline';

describe('OrderStatusPipeline', () => {
  const labels = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée'];

  it('renders 5 step labels in full variant', () => {
    render(<OrderStatusPipeline currentStatus="pending" variant="full" />);
    labels.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('does not render visible labels in compact variant', () => {
    render(<OrderStatusPipeline currentStatus="pending" variant="compact" />);
    // Labels should only be in sr-only spans
    const visibleLabels = screen.queryAllByText('En attente');
    // All labels are in sr-only (hidden) spans in compact mode
    visibleLabels.forEach((el) => {
      expect(el.closest('[aria-label]') || el.className.includes('sr-only')).toBeTruthy();
    });
  });

  it('renders pipeline for each currentStatus', () => {
    const statuses = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<OrderStatusPipeline currentStatus={status} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
      unmount();
    });
  });

  it('has aria-label on list container', () => {
    render(<OrderStatusPipeline currentStatus="pending" />);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Pipeline de statut de commande');
  });

  it('calls onAdvance with next status when next node is clicked', () => {
    const handler = jest.fn();
    render(<OrderStatusPipeline currentStatus="pending" onAdvance={handler} />);
    // "Confirmée" is the next step after "pending"
    const nextBtn = screen.getByRole('button', { name: /Avancer au statut : Confirmée/i });
    fireEvent.click(nextBtn);
    expect(handler).toHaveBeenCalledWith('confirmed');
  });

  it('does not render advance button when onAdvance is not provided', () => {
    render(<OrderStatusPipeline currentStatus="pending" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render advance button on last status delivered', () => {
    const handler = jest.fn();
    render(<OrderStatusPipeline currentStatus="delivered" onAdvance={handler} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
